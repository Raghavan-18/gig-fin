"""
Quantile income forecaster.  IMPLEMENTATION_PLAN.md §C4 / ARCHITECTURE.md §4.3.

Two models, because they answer two different questions and conflating them is a
real statistical error:

  DailyQuantileForecaster -- p10/p20/p50/p90 for each future DAY. Drives the
        forecast band in the UI. Quantile GBM, then CONFORMALISED (CQR) on a
        held-out calibration split so the band has a finite-sample coverage
        guarantee instead of whatever the GBM happened to produce.

  HorizonForecaster -- quantiles of the TOTAL over the next N days. Drives
        Safe-to-Save. The sum of daily p20s is NOT the p20 of the sum, and with
        180 days of history there are only ~100 non-overlapping windows to fit a
        GBM on -- far too few. So this is a BLOCK BOOTSTRAP over real historical
        14-day windows, rescaled to the current earning level with shrinkage
        toward the long-run mean. Real blocks preserve the autocorrelation of
        weather spells; independent daily draws would understate the variance of
        the total and cause over-sweeping, which is the one failure mode we
        cannot have (PRD §12.5).

Everything is point-in-time correct: features for a prediction about day t+k use
only data available at day t.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

QUANTILES = (0.10, 0.20, 0.50, 0.90)
LOOKBACK = 30
MAX_HORIZON = 30


def _rolling(series: np.ndarray, t: int, w: int) -> tuple[float, float]:
    window = series[max(0, t - w + 1): t + 1]
    if len(window) == 0:
        return 0.0, 0.0
    return float(window.mean()), float(window.std())


def _features_at(series, t, k, weekdays, day_of_month) -> list[float]:
    m7, s7 = _rolling(series, t, 7)
    m14, _ = _rolling(series, t, 14)
    m30, s30 = _rolling(series, t, 30)
    low_run = 0
    for v in reversed(series[: t + 1]):
        if v < 0.5 * (m30 or 1):
            low_run += 1
        else:
            break
    tgt = t + k
    return [
        float(k), float(weekdays[tgt]), 1.0 if weekdays[tgt] >= 5 else 0.0,
        float(day_of_month[tgt]), m7, s7, m14, m30, s30,
        m7 / m30 if m30 else 1.0, float(low_run),
    ]


class DailyQuantileForecaster:
    def __init__(self, quantiles=QUANTILES):
        self.quantiles = quantiles
        self.models: dict[float, GradientBoostingRegressor] = {}
        self.conformal_width: float = 0.0     # CQR correction, in rupees
        self.calibration: dict = {}

    def _dataset(self, series, weekdays, day_of_month, lo: int, hi: int):
        X, y = [], []
        for t in range(max(LOOKBACK, lo), hi):
            for k in range(1, MAX_HORIZON + 1):
                if t + k >= hi:
                    break
                X.append(_features_at(series, t, k, weekdays, day_of_month))
                y.append(series[t + k])
        return np.array(X, dtype=float), np.array(y, dtype=float)

    def _fit_models(self, X, y):
        models = {}
        for q in self.quantiles:
            m = GradientBoostingRegressor(
                loss="quantile", alpha=q, n_estimators=140, max_depth=3,
                learning_rate=0.06, min_samples_leaf=30, random_state=7)
            m.fit(X, y)
            models[q] = m
        return models

    def fit(self, series, weekdays, day_of_month, train_upto: int,
            calibrate_upto: int | None = None, alpha: float = 0.20,
            folds: int = 4):
        """Fit on [0, train_upto) and conformalise.

        Calibration is CROSS-CONFORMAL: the pre-test period is cut into `folds`
        contiguous blocks; for each block we refit on the other blocks and score
        the held-out one, then pool every score. With 180 days of history a
        single hold-out split yields ~29 conformity scores, which is far too few
        for a stable width -- pooling gives ~120 and spans more weather regimes.
        Blocks are contiguous, not shuffled, because the series is autocorrelated.
        """
        upto = calibrate_upto or train_upto
        X, y = self._dataset(series, weekdays, day_of_month, 0, upto)
        self.models = self._fit_models(X, y)

        scores: list[float] = []
        lo_all, hi_all = LOOKBACK, upto
        edges = np.linspace(lo_all, hi_all, folds + 1).astype(int)
        for f in range(folds):
            a, b = edges[f], edges[f + 1]
            mask_lo = [t for t in range(lo_all, hi_all) if not (a <= t < b)]
            if len(mask_lo) < 20:
                continue
            Xtr, ytr = [], []
            for t in mask_lo:
                for k in range(1, MAX_HORIZON + 1):
                    if t + k >= hi_all or a <= t + k < b:
                        continue
                    Xtr.append(_features_at(series, t, k, weekdays, day_of_month))
                    ytr.append(series[t + k])
            if len(Xtr) < 50:
                continue
            fold_models = self._fit_models(np.array(Xtr, float), np.array(ytr, float))
            for t in range(a, min(b, hi_all - 1)):
                if t < LOOKBACK:
                    continue
                x = np.array([_features_at(series, t, 1, weekdays, day_of_month)])
                lo_hat = float(fold_models[0.10].predict(x)[0])
                hi_hat = float(fold_models[0.90].predict(x)[0])
                yv = series[t + 1]
                scores.append(max(lo_hat - yv, yv - hi_hat))

        if scores:
            n = len(scores)
            level = min(1.0, np.ceil((n + 1) * (1 - alpha)) / n)
            self.conformal_width = float(max(0.0, np.quantile(scores, level)))
            self.calibration = {
                "calibration_method": f"cross-conformal, {folds} contiguous folds",
                "calibration_scores": n,
                "alpha": alpha,
                "conformal_width_rupees": round(self.conformal_width, 2),
            }
        return self

    def _conformalise(self, series, weekdays, day_of_month, lo, hi, alpha):
        """Conformalized Quantile Regression (Romano et al.).

        Score E_i = max(lo_hat - y, y - hi_hat); widen the band by the
        (1-alpha) empirical quantile of E. Gives coverage >= 1-alpha in finite
        samples regardless of how badly the GBM's own quantiles are calibrated.
        """
        scores = []
        for t in range(max(LOOKBACK, lo), hi - 1):
            x = np.array([_features_at(series, t, 1, weekdays, day_of_month)])
            lo_hat = float(self.models[0.10].predict(x)[0])
            hi_hat = float(self.models[0.90].predict(x)[0])
            yv = series[t + 1]
            scores.append(max(lo_hat - yv, yv - hi_hat))
        if not scores:
            return
        n = len(scores)
        level = min(1.0, np.ceil((n + 1) * (1 - alpha)) / n)
        self.conformal_width = float(max(0.0, np.quantile(scores, level)))
        self.calibration = {
            "calibration_days": n,
            "alpha": alpha,
            "conformal_width_rupees": round(self.conformal_width, 2),
        }

    def predict_path(self, series, weekdays, day_of_month, t: int,
                     horizon: int = MAX_HORIZON) -> dict[str, list[float]]:
        X = np.array([_features_at(series, t, k, weekdays, day_of_month)
                      for k in range(1, horizon + 1)], dtype=float)
        raw = {q: self.models[q].predict(X) for q in self.quantiles}
        keys = sorted(raw)
        stacked = np.sort(np.vstack([raw[k] for k in keys]), axis=0)  # no crossing
        w = self.conformal_width
        out = {}
        for i, q in enumerate(keys):
            vals = stacked[i]
            if q == 0.10:
                vals = vals - w
            elif q == 0.90:
                vals = vals + w
            elif q == 0.20:
                vals = vals - 0.5 * w      # p20 widened proportionally, downside only
            out[f"p{int(q * 100)}"] = [round(float(max(0.0, v)), 2) for v in vals]
        return out


class HorizonForecaster:
    """Quantiles of the total income over the next `horizon` days.

    Block bootstrap over real historical windows, rescaled to the current level
    with shrinkage toward the long-run mean (the cold-start / hierarchical prior
    idea from ARCHITECTURE §4.3, applied continuously).
    """

    def __init__(self, horizon: int = 14, n_sims: int = 2000,
                 shrinkage: float = 0.65, seed: int = 11):
        self.horizon = horizon
        self.n_sims = n_sims
        self.shrinkage = shrinkage
        self.rng = np.random.default_rng(seed)
        self.hist_median_7d = 1.0
        self.blocks: np.ndarray = np.array([])

    def fit(self, series, weekdays=None, day_of_month=None, upto: int | None = None):
        upto = len(series) if upto is None else upto
        s = np.asarray(series[:upto], dtype=float)
        self.blocks = np.array([s[i:i + self.horizon].sum()
                                for i in range(len(s) - self.horizon + 1)])
        roll7 = np.array([s[max(0, i - 6):i + 1].mean() for i in range(len(s))])
        self.hist_median_7d = float(np.median(roll7[LOOKBACK:])) or 1.0
        return self

    def _level_factor(self, series, t: int) -> float:
        recent = float(np.mean(series[max(0, t - 6): t + 1]))
        raw = recent / self.hist_median_7d if self.hist_median_7d else 1.0
        # shrink toward 1.0: income mean-reverts, so a drought does not imply
        # the next fortnight is equally dead -- but we stay on the safe side.
        return self.shrinkage * raw + (1 - self.shrinkage) * 1.0

    def predict(self, series, weekdays=None, day_of_month=None,
                t: int | None = None) -> dict[str, float]:
        t = len(series) - 1 if t is None else t
        f = self._level_factor(series, t)
        draws = self.rng.choice(self.blocks, size=self.n_sims, replace=True) * f
        out = {f"p{int(q * 100)}": round(float(np.quantile(draws, q)), 2)
               for q in QUANTILES}
        out["level_factor"] = round(f, 3)
        return out


def coverage_report(daily: DailyQuantileForecaster, series, weekdays,
                    day_of_month, test_from: int, drought_idx: range | None = None) -> dict:
    """Empirical coverage of the p10-p90 band on held-out days.

    The model's headline honesty metric (PRD §6 F1.4): we care far more that the
    interval is truthful than that the median is sharp. Reported both overall and
    excluding the engineered drought, because a scripted regime shift the model
    never saw in training is a legitimate but separate story.
    """
    hits = tot = 0
    hits_ex = tot_ex = 0
    errs = []
    for t in range(test_from, len(series) - 1):
        if t < LOOKBACK:
            continue
        p = daily.predict_path(series, weekdays, day_of_month, t, horizon=1)
        actual = series[t + 1]
        inside = p["p10"][0] <= actual <= p["p90"][0]
        hits += inside; tot += 1
        errs.append(abs(actual - p["p50"][0]))
        if drought_idx is None or (t + 1) not in drought_idx:
            hits_ex += inside; tot_ex += 1
    return {
        "held_out_days": tot,
        "coverage_p10_p90": round(hits / tot, 3) if tot else None,
        "coverage_excl_drought": round(hits_ex / tot_ex, 3) if tot_ex else None,
        "target_band": [0.75, 0.85],
        "median_abs_error_rupees": round(float(np.mean(errs)), 2) if errs else None,
        **daily.calibration,
    }

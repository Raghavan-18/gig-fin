import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Part 1 Pages & Persona Entry
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import WorkerOnboardingPage from './pages/WorkerOnboardingPage';
import ConsentIntroPage from './pages/ConsentIntroPage';
import BankSelectionPage from './pages/BankSelectionPage';
import ConsentReviewPage from './pages/ConsentReviewPage';
import ConsentSuccessPage from './pages/ConsentSuccessPage';

// Part 2 Pages
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SavingsPage from './pages/SavingsPage';

// Part 3 Pages
import GigScorePage from './pages/GigScorePage';
import FinancialGuidancePage from './pages/FinancialGuidancePage';
import ProfilePage from './pages/ProfilePage';
import ConsentManagementPage from './pages/ConsentManagementPage';
import SettingsPage from './pages/SettingsPage';

// Dhara Comparison Page
import ComparisonPage from './pages/ComparisonPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Persona Entry & Simulated AA Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/onboarding" element={<WorkerOnboardingPage />} />
          <Route path="/consent" element={<ConsentIntroPage />} />
          <Route path="/consent/bank-selection" element={<BankSelectionPage />} />
          <Route path="/consent/review" element={<ConsentReviewPage />} />
          <Route path="/consent/success" element={<ConsentSuccessPage />} />

          {/* Dhara Core Banking Views */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/savings" element={<SavingsPage />} />

          {/* Credit, Guidance, and Comparison */}
          <Route path="/gig-score" element={<GigScorePage />} />
          <Route path="/financial-guidance" element={<FinancialGuidancePage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/consent-management" element={<ConsentManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

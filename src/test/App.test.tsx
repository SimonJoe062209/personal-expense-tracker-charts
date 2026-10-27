import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('MONETA Full App Integration with Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders authentication page with 1-click Demo Account button when logged out', () => {
    render(<App />);
    expect(screen.getByText('Evaluation Demo Account')).toBeInTheDocument();
    expect(screen.getByText('Enter with Demo Account')).toBeInTheDocument();
    expect(screen.getByText('demo@moneta.app')).toBeInTheDocument();
    expect(screen.getByText('demo123456')).toBeInTheDocument();
  });

  describe('Authenticated Dashboard View', () => {
    beforeEach(() => {
      // Simulate authenticated demo session
      localStorage.setItem('moneta_auth_token', 'mock_jwt_token_for_tests');
      localStorage.setItem(
        'moneta_auth_user',
        JSON.stringify({
          id: 'user-demo-123',
          name: 'Rohan Sharma',
          email: 'demo@moneta.app',
          isDemo: true,
        })
      );
    });

    it('renders application navigation and brand title', () => {
      render(<App />);
      expect(screen.getByText('MONETA')).toBeInTheDocument();
      expect(screen.getByText('Financial Overview')).toBeInTheDocument();
    });

    it('renders all 4 summary KPI metric cards on dashboard', () => {
      render(<App />);
      expect(screen.getByText('Net Capital Balance')).toBeInTheDocument();
      expect(screen.getByText('Period Income')).toBeInTheDocument();
      expect(screen.getAllByText('Total Outlays')[0]).toBeInTheDocument();
      expect(screen.getByText('Savings Velocity')).toBeInTheDocument();
    });

    it('displays navigation items for all 5 core routes', () => {
      render(<App />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Budgets')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });
});

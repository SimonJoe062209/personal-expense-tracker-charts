import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('MONETA Full App Integration', () => {
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

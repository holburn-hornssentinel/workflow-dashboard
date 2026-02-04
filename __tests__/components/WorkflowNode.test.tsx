import { render, screen } from '@testing-library/react';
import WorkflowNode from '@/components/WorkflowNode';

// Mock React Flow's Handle component
jest.mock('@xyflow/react', () => ({
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}`} />,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

describe('WorkflowNode', () => {
  it('should render node with label', () => {
    const data = {
      label: 'Test Step',
    };

    render(<WorkflowNode data={data} selected={false} />);

    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('should render duration when provided', () => {
    const data = {
      label: 'Test Step',
      duration: '10 minutes',
    };

    render(<WorkflowNode data={data} selected={false} />);

    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.getByText('⏱️')).toBeInTheDocument();
  });

  it('should render model recommendation when provided', () => {
    const data = {
      label: 'Test Step',
      model: 'claude-sonnet',
    };

    render(<WorkflowNode data={data} selected={false} />);

    expect(screen.getByText('claude-sonnet')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    const data = {
      label: 'Test Step',
      description: 'This is a test description',
    };

    render(<WorkflowNode data={data} selected={false} />);

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should apply selected styling when selected', () => {
    const data = {
      label: 'Test Step',
    };

    const { container } = render(<WorkflowNode data={data} selected={true} />);

    const nodeDiv = container.firstChild as HTMLElement;
    expect(nodeDiv.className).toContain('border-blue-400');
    expect(nodeDiv.className).toContain('scale-105');
  });

  it('should apply default styling when not selected', () => {
    const data = {
      label: 'Test Step',
    };

    const { container } = render(<WorkflowNode data={data} selected={false} />);

    const nodeDiv = container.firstChild as HTMLElement;
    expect(nodeDiv.className).toContain('border-slate-600');
  });

  it('should render both handles (source and target)', () => {
    const data = {
      label: 'Test Step',
    };

    render(<WorkflowNode data={data} selected={false} />);

    expect(screen.getByTestId('handle-target')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source')).toBeInTheDocument();
  });

  it('should render all metadata when all fields provided', () => {
    const data = {
      label: 'Complete Step',
      duration: '30 minutes',
      model: 'claude-opus',
      description: 'A complete step with all fields',
    };

    render(<WorkflowNode data={data} selected={false} />);

    expect(screen.getByText('Complete Step')).toBeInTheDocument();
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
    expect(screen.getByText('claude-opus')).toBeInTheDocument();
    expect(screen.getByText('A complete step with all fields')).toBeInTheDocument();
  });

  it('should handle missing data gracefully', () => {
    render(<WorkflowNode data={null} selected={false} />);

    // Should render "Step" as fallback
    expect(screen.getByText('Step')).toBeInTheDocument();
  });
});

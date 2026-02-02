import {
  loadWorkflows,
  workflowToGraph,
  workflowToSlug,
  getWorkflow,
  getWorkflowStats,
  type Workflow,
} from '@/lib/workflow-parser';

describe('workflow-parser', () => {
  describe('workflowToSlug', () => {
    it('should convert workflow name to URL-friendly slug', () => {
      const workflow: Workflow = {
        name: 'Bug Fix Workflow',
        version: '1.0.0',
        description: 'Test workflow',
        steps: {},
      };

      expect(workflowToSlug(workflow)).toBe('bug-fix-workflow');
    });

    it('should handle special characters', () => {
      const workflow: Workflow = {
        name: 'Feature: New Authentication!',
        version: '1.0.0',
        description: 'Test',
        steps: {},
      };

      expect(workflowToSlug(workflow)).toBe('feature-new-authentication');
    });

    it('should handle multiple spaces', () => {
      const workflow: Workflow = {
        name: 'Test    Multiple   Spaces',
        version: '1.0.0',
        description: 'Test',
        steps: {},
      };

      expect(workflowToSlug(workflow)).toBe('test-multiple-spaces');
    });
  });

  describe('workflowToGraph', () => {
    it('should create nodes and edges from workflow steps', () => {
      const workflow: Workflow = {
        name: 'Test Workflow',
        version: '1.0.0',
        description: 'Test',
        steps: {
          step_1: {
            name: 'First Step',
            duration: '10 min',
            model_recommendation: 'claude-sonnet',
          },
          step_2: {
            name: 'Second Step',
            duration: '20 min',
          },
          step_3: {
            name: 'Third Step',
          },
        },
      };

      const { nodes, edges } = workflowToGraph(workflow);

      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(2); // 3 steps = 2 edges

      // Check first node
      expect(nodes[0].id).toBe('step_1');
      expect(nodes[0].data.label).toBe('First Step');
      expect(nodes[0].data.duration).toBe('10 min');
      expect(nodes[0].data.model).toBe('claude-sonnet');

      // Check edges connect properly
      expect(edges[0].source).toBe('step_1');
      expect(edges[0].target).toBe('step_2');
      expect(edges[1].source).toBe('step_2');
      expect(edges[1].target).toBe('step_3');
    });

    it('should use zigzag layout for positioning', () => {
      const workflow: Workflow = {
        name: 'Test Workflow',
        version: '1.0.0',
        description: 'Test',
        steps: {
          step_1: { name: 'Step 1' },
          step_2: { name: 'Step 2' },
          step_3: { name: 'Step 3' },
          step_4: { name: 'Step 4' },
        },
      };

      const { nodes } = workflowToGraph(workflow);

      // Updated for new layout: HORIZONTAL_SPACING = 500, VERTICAL_SPACING = 280, ITEMS_PER_ROW = 2
      // First row (even): left to right
      expect(nodes[0].position.x).toBe(100); // col 0
      expect(nodes[1].position.x).toBe(600); // col 1 (100 + 500)

      // Second row (odd): right to left (reversed)
      expect(nodes[2].position.x).toBe(600); // col 0 reversed to position 1
      expect(nodes[2].position.y).toBe(330); // row 1 (50 + 280)
      expect(nodes[3].position.x).toBe(100); // col 1 reversed to position 0
      expect(nodes[3].position.y).toBe(330); // row 1
    });
  });

  describe('getWorkflowStats', () => {
    it('should calculate correct statistics', () => {
      const workflow: Workflow = {
        name: 'Test Workflow',
        version: '1.0.0',
        description: 'Test',
        estimated_duration: '2 hours',
        difficulty: 'high',
        steps: {
          step_1: {
            name: 'Step 1',
            model_recommendation: 'claude-sonnet',
            tasks: {
              task1: { name: 'Task 1' },
              task2: { name: 'Task 2' },
            },
          },
          step_2: {
            name: 'Step 2',
            model_recommendation: 'claude-opus',
            tasks: {
              task1: { name: 'Task 1' },
            },
          },
          step_3: {
            name: 'Step 3',
            model_recommendation: 'claude-sonnet', // Duplicate model
          },
        },
      };

      const stats = getWorkflowStats(workflow);

      expect(stats.stepCount).toBe(3);
      expect(stats.totalTasks).toBe(3); // 2 + 1 + 0
      expect(stats.modelsUsed).toEqual(['claude-sonnet', 'claude-opus']);
      expect(stats.estimatedDuration).toBe('2 hours');
      expect(stats.difficulty).toBe('high');
    });

    it('should handle workflow with no tasks', () => {
      const workflow: Workflow = {
        name: 'Test Workflow',
        version: '1.0.0',
        description: 'Test',
        steps: {
          step_1: { name: 'Step 1' },
        },
      };

      const stats = getWorkflowStats(workflow);

      expect(stats.stepCount).toBe(1);
      expect(stats.totalTasks).toBe(0);
      expect(stats.modelsUsed).toEqual([]);
    });
  });

  describe('loadWorkflows', () => {
    it('should load workflows from ~/.claude/workflows directory', () => {
      const workflows = loadWorkflows();

      // Should find at least the workflows we created
      expect(workflows.length).toBeGreaterThan(0);

      // Each workflow should have required fields
      workflows.forEach(workflow => {
        expect(workflow).toHaveProperty('name');
        expect(workflow).toHaveProperty('version');
        expect(workflow).toHaveProperty('description');
        expect(workflow).toHaveProperty('steps');
        expect(typeof workflow.steps).toBe('object');
      });
    });
  });

  describe('getWorkflow', () => {
    it('should find workflow by exact name match', () => {
      const workflow = getWorkflow('bug-fix-workflow');
      expect(workflow).not.toBeNull();
      expect(workflow?.name).toContain('Bug Fix');
    });

    it('should find workflow by partial name match', () => {
      const workflow = getWorkflow('bug-fix');
      expect(workflow).not.toBeNull();
    });

    it('should handle normalized names', () => {
      const workflow = getWorkflow('bugfix');
      expect(workflow).not.toBeNull();
    });

    it('should return null for non-existent workflow', () => {
      const workflow = getWorkflow('non-existent-workflow-xyz');
      expect(workflow).toBeNull();
    });
  });
});

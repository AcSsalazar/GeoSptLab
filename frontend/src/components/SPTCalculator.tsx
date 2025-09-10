import React, { useState } from 'react';
import FormWizard from './forms/FormWizard';
import ProjectSetupForm from './forms/ProjectSetupForm';
import { ProjectCreate } from '../types/project';
import { projectAPI } from '../services/api';

const SPTCalculator: React.FC = () => {
  const [projectData, setProjectData] = useState<Partial<ProjectCreate>>({});
  const [isProjectValid, setIsProjectValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProjectDataChange = (data: Partial<ProjectCreate>, isValid: boolean) => {
    setProjectData(data);
    setIsProjectValid(isValid);
  };

  const handleComplete = async () => {
    if (!isProjectValid) {
      alert('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      const project = await projectAPI.create(projectData as ProjectCreate);
      alert(`Project ${project.project_code} created successfully!`);
      
      // Reset form or navigate to next step
      setProjectData({});
      setIsProjectValid(false);
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(`Error creating project: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 'project-setup',
      title: 'Project Setup',
      description: 'Configure basic project parameters and calculation settings',
      component: (
        <ProjectSetupForm
          initialData={projectData}
          onValidData={handleProjectDataChange}
        />
      ),
      isValid: isProjectValid
    },
    {
      id: 'strata-definition',
      title: 'Soil Strata',
      description: 'Define soil layers and their geotechnical properties',
      component: (
        <div className="text-center py-8">
          <p className="text-gray-500">Soil Strata form will be implemented here</p>
          <p className="text-sm text-gray-400 mt-2">This step will allow defining soil layers with their properties</p>
        </div>
      ),
      isValid: true // Temporary for demo
    },
    {
      id: 'borehole-data',
      title: 'Borehole Data',
      description: 'Input borehole locations and SPT test results',
      component: (
        <div className="text-center py-8">
          <p className="text-gray-500">Borehole Data form will be implemented here</p>
          <p className="text-sm text-gray-400 mt-2">This step will allow adding boreholes and SPT intervals</p>
        </div>
      ),
      isValid: true // Temporary for demo
    },
    {
      id: 'results',
      title: 'Results',
      description: 'View calculated geotechnical parameters and generate reports',
      component: (
        <div className="text-center py-8">
          <p className="text-gray-500">Results and calculations will be displayed here</p>
          <p className="text-sm text-gray-400 mt-2">This step will show calculated SPT parameters and visualizations</p>
        </div>
      ),
      isValid: true // Temporary for demo
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SPT Parameters Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Professional tool for Standard Penetration Test analysis and geotechnical parameter calculation
          </p>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Creating project...</p>
            </div>
          </div>
        )}

        <FormWizard
          steps={steps}
          onComplete={handleComplete}
          onStepChange={(step) => console.log('Step changed to:', step)}
        />
      </div>
    </div>
  );
};

export default SPTCalculator;
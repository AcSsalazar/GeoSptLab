import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Select from '../ui/Select';
import type { ProjectCreate } from '../../types/project';
import {FormulationType } from '../../types/project';

// Esquema de validacion usando Zod para los campor del formulario de datos por perforación. 

const projectSchema = z.object({
  
  field_energy_percent: z.number().min(1, 'Energia de campo % debe ser positivo').max(200, 'Maximo valido 200%').optional(),
  borehole_diameter: z.number().min(50, 'Dimametro minimo 50mm').max(1000, 'Diametro maximo 1000mm').optional(),
  rod_length: z.number().min(1, 'Rod length must be positive').max(100, 'Rod length too long').optional(),
  
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectSetupFormProps {
  initialData?: Partial<ProjectCreate>;
  onValidData: (data: ProjectFormData, isValid: boolean) => void;
}

const ProjectSetupForm: React.FC<ProjectSetupFormProps> = ({
  initialData,
  onValidData
}) => {
  const {
    register,
    watch,
    formState: { errors, isValid },
    getValues
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      project_code: initialData?.project_code || '',
      number_of_boreholes: initialData?.number_of_boreholes || 3,
      number_of_strata: initialData?.number_of_strata || 3,
      formulation: initialData?.formulation || FormulationType.KISHIDA,
      field_energy_percent: initialData?.field_energy_percent || 45,
      borehole_diameter: initialData?.borehole_diameter || 150,
      rod_length: initialData?.rod_length || 15,
      water_table_depth: initialData?.water_table_depth || undefined,
    },
    mode: 'onChange'
  });

  // Watch all form values and notify parent of changes
  React.useEffect(() => {
    const subscription = watch(() => {
      const formData = getValues();
      onValidData(formData, isValid);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onValidData, isValid]);

  const formulationOptions = [
    { value: FormulationType.KISHIDA, label: 'Kishida' },
    { value: FormulationType.JRB, label: 'JRB' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Project Code"
          {...register('project_code')}
          error={errors.project_code?.message}
          placeholder="e.g., CP-00630"
          required
        />

        <Select
          label="Calculation Formulation"
          {...register('formulation')}
          error={errors.formulation?.message}
          options={formulationOptions}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Number of Boreholes"
          type="number"
          {...register('number_of_boreholes', { valueAsNumber: true })}
          error={errors.number_of_boreholes?.message}
          min="1"
          max="100"
          required
        />

        <Input
          label="Number of Strata"
          type="number"
          {...register('number_of_strata', { valueAsNumber: true })}
          error={errors.number_of_strata?.message}
          min="1"
          max="50"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Field Energy Percentage"
          type="number"
          {...register('field_energy_percent', { valueAsNumber: true })}
          error={errors.field_energy_percent?.message}
          min="1"
          max="200"
          step="0.1"
          hint="Typical value is 45%"
          required
        />

        <Input
          label="Borehole Diameter (mm)"
          type="number"
          {...register('borehole_diameter', { valueAsNumber: true })}
          error={errors.borehole_diameter?.message}
          min="50"
          max="1000"
          hint="Standard is 150mm"
        />

        <Input
          label="Rod Length (m)"
          type="number"
          {...register('rod_length', { valueAsNumber: true })}
          error={errors.rod_length?.message}
          min="1"
          max="100"
          step="0.1"
          hint="Standard is 15m"
        />
      </div>

      <Input
        label="Water Table Depth (m)"
        type="number"
        {...register('water_table_depth', { valueAsNumber: true })}
        error={errors.water_table_depth?.message}
        min="0"
        max="500"
        step="0.1"
        hint="Leave empty if no water table or unknown"
      />

      {/* Form validation summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Project Summary</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>{watch('project_code') || 'Project Code'}</strong> with <strong>{watch('formulation')}</strong> formulation</p>
          <p>• <strong>{watch('number_of_boreholes')}</strong> boreholes and <strong>{watch('number_of_strata')}</strong> soil strata</p>
          <p>• <strong>{watch('field_energy_percent')}%</strong> field energy</p>
          {watch('water_table_depth') && (
            <p>• Water table at <strong>{watch('water_table_depth')}m</strong> depth</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupForm;
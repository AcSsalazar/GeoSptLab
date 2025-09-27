import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project } from '../../types/project';

// Define behavior type enum
const BehaviorType = z.enum(['cohesive', 'granular']);

// Schema for individual stratum
const stratumSchema = z.object({
  stratum_code: z.number().min(1, 'Código debe ser positivo').max(10, 'Código máximo es 10'),
  name: z.string().min(1, 'Nombre del estrato es necesario').max(100, 'Nombre muy largo'),
  description: z.string().min(1, 'Descripción es necesaria').max(500, 'Descripción muy larga'),
  initial_depth: z.number().min(0, 'Profundidad inicial debe ser positiva').max(500, 'Profundidad muy grande'),
  final_depth: z.number().min(0, 'Profundidad final debe ser positiva').max(500, 'Profundidad muy grande'),
  gamma_humid: z.number().min(10, 'Gamma húmedo mínimo 10 kN/m³').max(40, 'Gamma húmedo máximo 40 kN/m³'),
  gamma_saturated: z.number().min(10, 'Gamma saturado mínimo 10 kN/m³').max(40, 'Gamma saturado máximo 40 kN/m³'),
  behavior_type: BehaviorType,
  plasticity_index: z.number().min(0).max(100).optional()
}).refine((data) => data.final_depth > data.initial_depth, {
  message: 'Profundidad final debe ser mayor que inicial',
  path: ['final_depth']
});

// Schema for the entire form
const strataFormSchema = z.object({
  strata: z.array(stratumSchema).min(1, 'Debe haber al menos un estrato')
});

type StratumFormData = z.infer<typeof stratumSchema>;
type StrataFormData = z.infer<typeof strataFormSchema>;

interface StrataSetupFormProps {
  projectData: Project;
  onValidData: (data: StratumFormData[], isValid: boolean) => void;
}

const StrataSetupForm: React.FC<StrataSetupFormProps> = ({
  projectData,
  onValidData
}) => {
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
    getValues
  } = useForm<StrataFormData>({
    resolver: zodResolver(strataFormSchema),
    defaultValues: {
      strata: Array.from({ length: projectData.number_of_strata }, (_, index) => ({
        stratum_code: index + 1,
        name: `Estrato ${index + 1}`,
        description: '',
        initial_depth: index === 0 ? 0 : 0,
        final_depth: (index + 1) * 2,
        gamma_humid: 18,
        gamma_saturated: 20,
        behavior_type: 'granular' as const,
        plasticity_index: 0
      }))
    },
    mode: 'onChange'
  });

  const { fields } = useFieldArray({
    control,
    name: 'strata'
  });

  // Watch all form values and notify parent of changes
  useEffect(() => {
    const subscription = watch(() => {
      const formData = getValues();
      onValidData(formData.strata, isValid);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onValidData, isValid]);

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Definir {projectData.number_of_strata} Estratos - Proyecto: {projectData.project_name}
        </h3>
        <p className="text-blue-700 text-sm">
          Configure las propiedades geotécnicas de cada estrato de suelo
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h4 className="text-lg font-medium mb-4 text-gray-800">
            Estrato {index + 1}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stratum Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código del Estrato
              </label>
              <input
                type="number"
                {...register(`strata.${index}.stratum_code` as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="10"
              />
              {errors.strata?.[index]?.stratum_code && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.stratum_code?.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Estrato
              </label>
              <input
                type="text"
                {...register(`strata.${index}.name` as const)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="ej: Arena fina"
              />
              {errors.strata?.[index]?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.name?.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register(`strata.${index}.description` as const)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="Descripción detallada del estrato"
              />
              {errors.strata?.[index]?.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.description?.message}
                </p>
              )}
            </div>

            {/* Depth Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profundidad Inicial (m)
              </label>
              <input
                type="number"
                step="0.1"
                {...register(`strata.${index}.initial_depth` as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
              {errors.strata?.[index]?.initial_depth && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.initial_depth?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profundidad Final (m)
              </label>
              <input
                type="number"
                step="0.1"
                {...register(`strata.${index}.final_depth` as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
              {errors.strata?.[index]?.final_depth && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.final_depth?.message}
                </p>
              )}
            </div>

            {/* Gamma Values */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gamma Húmedo (kN/m³)
              </label>
              <input
                type="number"
                step="0.1"
                {...register(`strata.${index}.gamma_humid` as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="10"
                max="40"
              />
              {errors.strata?.[index]?.gamma_humid && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.gamma_humid?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gamma Saturado (kN/m³)
              </label>
              <input
                type="number"
                step="0.1"
                {...register(`strata.${index}.gamma_saturated` as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="10"
                max="40"
              />
              {errors.strata?.[index]?.gamma_saturated && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.gamma_saturated?.message}
                </p>
              )}
            </div>

            {/* Behavior Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Comportamiento
              </label>
              <select
                {...register(`strata.${index}.behavior_type` as const)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="granular">Granular</option>
                <option value="cohesive">Cohesivo</option>
              </select>
              {errors.strata?.[index]?.behavior_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.strata[index]?.behavior_type?.message}
                </p>
              )}
            </div>

            {/* Plasticity Index (conditional) */}
            {watch(`strata.${index}.behavior_type`) === 'cohesive' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Índice de Plasticidad (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`strata.${index}.plasticity_index` as const, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  max="100"
                />
                {errors.strata?.[index]?.plasticity_index && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.strata[index]?.plasticity_index?.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Form Summary */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">Estado del Formulario</h4>
        <div className="text-sm text-green-700">
          <p>
            ✅ {fields.length} estratos configurados para el proyecto "{projectData.project_name}"
          </p>
          <p>
            {isValid ? '✅' : '❌'} Validación: {isValid ? 'Formulario válido' : 'Revisa los errores'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrataSetupForm;
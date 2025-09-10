import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Header from './components/base/Header';
import FormWizard from './components/forms/FormWizard';
import './App.css';

function HomePage() {
  const navigate = useNavigate();

  const startNewProject = () => {
    navigate('/wizard');
  };

  return (
    <main style={{ marginTop: '70px', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-strong)', marginBottom: '1rem' }}>
          SPT Analysis Tool
        </h1>
        <p style={{ color: 'var(--main-text-color)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Herramienta profesional para análisis de ensayos de penetración estándar (SPT) 
          en proyectos de consultoría civil.
        </p>
      </div>
      
      <div style={{ 
        marginTop: '3rem', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        maxWidth: '1000px',
        margin: '3rem auto 0'
      }}>
        <div style={{ 
          padding: '2rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: 'var(--color-strong)', marginBottom: '1rem' }}>
            Nuevo Proyecto SPT
          </h3>
          <p style={{ color: 'var(--main-text-color)', marginBottom: '1.5rem' }}>
            Crear un nuevo proyecto de análisis SPT con asistente paso a paso.
          </p>
          <SignedIn>
            <button 
              onClick={startNewProject}
              style={{
                backgroundColor: 'var(--color-strong)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Comenzar Proyecto
            </button>
          </SignedIn>
          <SignedOut>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Inicia sesión para crear proyectos
            </p>
          </SignedOut>
        </div>
        
        <div style={{ 
          padding: '2rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: 'var(--color-strong)', marginBottom: '1rem' }}>
            Cálculos Automáticos
          </h3>
          <p style={{ color: 'var(--main-text-color)' }}>
            Procesamiento automático de parámetros geotécnicos según correlaciones Kishida y JRB.
          </p>
        </div>
        
        <div style={{ 
          padding: '2rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: 'var(--color-strong)', marginBottom: '1rem' }}>
            Reportes Técnicos
          </h3>
          <p style={{ color: 'var(--main-text-color)' }}>
            Generación de reportes profesionales con gráficos y análisis de regresión.
          </p>
        </div>
      </div>
    </main>
  );
}

function WizardPage() {
  const navigate = useNavigate();

  const handleWizardComplete = (projectId: number) => {
    // Navigate to results page or project view
    navigate(`/project/${projectId}/results`);
  };

  const handleWizardCancel = () => {
    navigate('/');
  };

  return (
    <SignedIn>
      <main style={{ marginTop: '70px', padding: '1rem' }}>
        <FormWizard 
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </main>
    </SignedIn>
  );
}

function ProjectResultsPage() {
  const navigate = useNavigate();

  return (
    <main style={{ marginTop: '70px', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Resultados del Proyecto</h1>
        <p>Esta página mostrará los resultados calculados del proyecto SPT.</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Volver al inicio
        </button>
      </div>
    </main>
  );
}

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/wizard" element={<WizardPage />} />
        <Route path="/project/:id/results" element={<ProjectResultsPage />} />
      </Routes>
    </>
  );
}

export default App;

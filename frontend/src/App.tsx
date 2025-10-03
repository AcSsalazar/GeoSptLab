import { Routes, Route } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Home from '@/components/pages/Home';
import SPTCalculator from '@/components/pages/SPTCalculator';

function App() {
  return (
    <>
      <Header />
      
      {/* Main content with top margin for fixed header */}
      <main style={{ marginTop: 'calc(var(--space-6) + var(--space-2))' }}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/calculator' element={<SPTCalculator />} />
        </Routes>
      </main>
      
      <Footer />
      <div id="popup-root"></div>
    </>
  );
}

export default App;

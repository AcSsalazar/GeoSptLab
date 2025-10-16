import { Routes, Route } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Home from '@/components/pages/Home';
import SPTCalculator from '@/components/pages/SPTCalculator';
import Documentation from '@/components/pages/Documentation';
import Manual from './components/pages/UsersManual';
import TheoryDoc from './components/pages/Theory';
import NotFound from './components/pages/NotFound';
function App() {
  return (
    <>
      <Header />
      
      {/* Main content with top margin for fixed header */}
      <main style={{ marginTop: 'calc(var(--space-6) + var(--space-2))' }}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/calculator' element={<SPTCalculator />} />
          <Route path='/devdocs' element={<Documentation />} />
          <Route path='/manual' element={<Manual />} />
          <Route path='/theory' element={<TheoryDoc/>} />
          <Route path='*' element={< NotFound/>} />
          
        </Routes>
      </main>
      
      <Footer />
      <div id="popup-root"></div>
    </>
  );
}

export default App;

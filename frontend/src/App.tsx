import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Batch } from './pages/Batch'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Services } from './pages/Services'
import { About } from './pages/About'
import { Layout } from './components/layout/Layout'
import { MriClassification } from './pages/MriClassification'
import { MriSegmentation } from './pages/MriSegmentation'
import { MlAnalysis } from './pages/MlAnalysis'
import { IotMonitoring } from './pages/IotMonitoring'
import { Anamnesis } from './pages/Anamnesis'
import { CvAnalysis } from './pages/CvAnalysis'
import { GeneticAnalysis } from './pages/GeneticAnalysis'
import { AlphaFold } from './pages/AlphaFold'
import { BloodAnalysis } from './pages/BloodAnalysis'
import { BloodBiochemistry } from './pages/BloodBiochemistry'
import { Profile } from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="batch" element={<Batch />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="mri" element={<MriClassification />} />
          <Route path="mri-segmentation" element={<MriSegmentation />} />
          <Route path="ml-analysis" element={<MlAnalysis />} />
          <Route path="iot" element={<IotMonitoring />} />
          <Route path="anamnesis" element={<Anamnesis />} />
          <Route path="cv-analysis" element={<CvAnalysis />} />
          <Route path="genetic" element={<GeneticAnalysis />} />
          <Route path="alphafold" element={<AlphaFold />} />
          <Route path="blood" element={<BloodAnalysis />} />
          <Route path="blood/biochemistry" element={<BloodBiochemistry />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

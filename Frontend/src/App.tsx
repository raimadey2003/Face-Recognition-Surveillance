import React from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import PoliceLogin from './components/PoliceLogin';
import MissingPersonReport from './components/MissingPersonReport';
import PoliceDashboard from './components/PoliceDashboard';
import PoliceRegistration from './components/PoliceRegistration';
import UserLogin from './components/UserLogin';
import UserRegistration from './components/UserRegistration';
import UserDashboard from './components/UserDashboard';
import { 
  Eye, 
  Smartphone, 
  Zap, 
  Shield, 
  Phone, 
  FileText, 
  HelpCircle,
  UserCheck,
  Search,
  AlertTriangle
} from 'lucide-react';

// 3D Scanning Globe Component
// function ScanningGlobe() {
//   return (
//     <mesh>
//       <Sphere args={[1, 32, 32]}>
//         <meshStandardMaterial
//           color="#0A3D62"
//           transparent
//           opacity={0.3}
//           wireframe
//         />
//       </Sphere>
//       <mesh>
//         <sphereGeometry args={[1.05, 16, 16]} />
//         <meshBasicMaterial
//           color="#60A5FA"
//           transparent
//           opacity={0.1}
//           wireframe
//         />
//       </mesh>
//     </mesh>
//   );
// }

// 3D Scanning Globe Component (Bigger Version)
function ScanningGlobe() {
  return (
    <mesh scale={3.3}>   {/* ⬅️ Increased globe size */}
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial
          color="#00D9FF"
          transparent
          opacity={0.7}
          wireframe
        />
      </Sphere>

      <mesh scale={1.1}>  {/* Outer glow slightly bigger */}
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#06B6D4"
          transparent
          opacity={0.5}
          wireframe
        />
      </mesh>
    </mesh>
  );
}


// Counter Component with Animation
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      setCount(Math.floor(end * percentage));
      
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

function App() {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'police-login' | 'police-register' | 'missing-report' | 'dashboard'| 'user-login' | 'user-register'| 'user-dashboard'>('home');

  if (currentPage === 'police-login') {
    return (
      // <PoliceLogin 
      //   onBack={() => setCurrentPage('home')} 
      //   onLoginSuccess={() => setCurrentPage('dashboard')}
      // />
      <PoliceLogin 
        onBack={() => setCurrentPage('home')} 
        onLoginSuccess={() => setCurrentPage('dashboard')}
        onSwitchToRegister={() => setCurrentPage('police-register')} // 🔹 add this
      />

    );
  }

  if (currentPage === 'police-register') {
  return (
    <PoliceRegistration 
      onBack={() => setCurrentPage('home')}
      onRegistrationSuccess={() => setCurrentPage('police-login')}
      onSwitchToLogin={() => setCurrentPage('police-login')}
    />
  );
}

if (currentPage === 'user-login') {
  return (
    <UserLogin
      onBack={() => setCurrentPage('home')}
      onLoginSuccess={() => setCurrentPage('user-dashboard')}
      onSwitchToRegister={() => setCurrentPage('user-register')}
    />
  );
}

if (currentPage === 'user-register') {
  return (
    <UserRegistration
      onBack={() => setCurrentPage('home')}
      onRegistrationSuccess={() => setCurrentPage('user-login')}
      onSwitchToLogin={() => setCurrentPage('user-login')}
    />
  );
}
  if (currentPage === 'user-dashboard') {
  return (
    <UserDashboard
      onBack={() => setCurrentPage('home')}
      onCreateReport={() => setCurrentPage('missing-report')}
      onLogout={() => setCurrentPage('home')}
    />
  );
}


  if (currentPage === 'missing-report') {
    return <MissingPersonReport onBack={() => setCurrentPage('user-dashboard')} />;
  }

  if (currentPage === 'dashboard') {
    return <PoliceDashboard onLogout={() => setCurrentPage('home')} />;
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const features = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Face Recognition Surveillance",
      description: "Advanced AI-powered facial recognition technology for real-time identification and tracking."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Centralized Communication",
      description: "Unified platform connecting police officers, volunteers, and the public for coordinated response."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Alerts",
      description: "Lightning-fast notification system for immediate response to missing person reports."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy & Security",
      description: "End-to-end encryption and strict privacy protocols ensuring data protection and compliance."
    }
  ];

  const stats = [
    { label: "Reports Handled", value: 2847, suffix: "+" },
    { label: "Missing Persons Found", value: 1523, suffix: "" },
    { label: "Alerts Generated", value: 5962, suffix: "" },
    { label: "Active Officers", value: 189, suffix: "" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="container mx-auto px-6 lg:px-8 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              className="text-center lg:text-left"
              initial="initial"
              animate="animate"
              variants={staggerChildren}
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                variants={fadeInUp}
              >
                Smart Surveillance & 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  {" "}Communication
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed"
                variants={fadeInUp}
              >
                Advanced face recognition and unified communication system ensuring public safety at Simhastha Ujjain
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                variants={fadeInUp}
              >
                <motion.button
                  onClick={() => setCurrentPage('police-login')}
                  className="group px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-6 h-6" />
                  Login as Police Officer
                </motion.button>
                
                <motion.button
                  onClick={() => setCurrentPage('user-login')}
                  className="group px-8 py-4 bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-2xl text-white font-semibold text-lg hover:bg-red-500/30 transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserCheck className="w-6 h-6" />
                  User Login / Register
                </motion.button>
              </motion.div>
            </motion.div>

            {/* <motion.button
              onClick={() => setCurrentPage('user-login')}
              className="group px-8 py-4 bg-blue-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl text-white font-semibold text-lg hover:bg-blue-500/30 transition-all duration-300 flex items-center justify-center gap-3"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserCheck className="w-6 h-6" />
              User Login / Register
            </motion.button> */}


            {/* Right Content - 3D Model */}
            {/* <motion.div 
              className="h-96 lg:h-[500px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <ScanningGlobe />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
              </Canvas>
            </motion.div> */}

            {/* Right Content - 3D Model */}
<motion.div 
  className="
    absolute 
    top-0
    right-0
    bottom-0
    w-1/2
    h-full
    z-[-1] 
    pointer-events-none
    overflow-hidden
  "
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8, delay: 0.3 }}
  style={{ willChange: 'auto' }}
>
  <Canvas 
    camera={{ position: [3, 0, 5] }}
    style={{ width: '100%', height: '100%' }}
    gl={{ preserveDrawingBuffer: true }}
  >
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <ScanningGlobe />
    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
  </Canvas>
</motion.div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Protecting What Matters Most
              </h2>
              <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">
                During the massive gathering at Simhastha Ujjain, thousands of people can get separated from their families or lose important belongings. 
                Our advanced surveillance system combines cutting-edge face recognition technology with a unified communication platform to quickly 
                locate missing persons and items, ensuring the safety and peace of mind for all pilgrims and visitors.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Advanced Safety Features
            </h2>
            <p className="text-xl text-gray-300">
              Comprehensive technology stack designed for public safety
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="text-blue-400 mb-6 group-hover:text-blue-300 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-gray-300 text-sm lg:text-base">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-xl border-t border-white/10 py-12 px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Emergency Contact */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-center md:justify-start gap-2">
                <Phone className="w-5 h-5 text-red-400" />
                Emergency Contact
              </h3>
              <p className="text-gray-300 mb-2">Police Control Room</p>
              <p className="text-2xl font-bold text-red-400">100</p>
              <p className="text-sm text-gray-400">Available 24/7</p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Privacy Policy
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Data Security
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Help & Support
                </a>
              </div>
            </div>

            {/* System Info */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
              <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">All Systems Operational</span>
              </div>
              <p className="text-sm text-gray-400">Last updated: Just now</p>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Simhastha Ujjain Surveillance System. All rights reserved. | Built for public safety and security.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
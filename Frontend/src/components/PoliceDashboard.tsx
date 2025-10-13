import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Eye, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Camera, 
  Filter, 
  Download, 
  Bell, 
  Settings, 
  LogOut,
  User,
  Package,
  Activity,
  TrendingUp,
  Calendar,
  FileText,
  Zap,
  Target,
  Radio,
  Monitor
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

interface MissingCase {
  id: string;
  type: 'person' ;
  name: string;
  reportedBy: string;
  location: string;
  time: string;
  status: 'active' | 'found' | 'investigating';
  priority: 'high' | 'medium' | 'low';
  description: string;
  photo?: string;
}

interface Alert {
  id: string;
  type: 'match' | 'sighting' | 'emergency';
  message: string;
  time: string;
  location: string;
  caseId?: string;
}

export default function PoliceDashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'surveillance' | 'alerts'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'found' | 'investigating'>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cases, setCases] = useState<MissingCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<MissingCase | null>(null);


  // Mock data
  // useEffect(() => {
  //   const mockCases: MissingCase[] = [
  //     {
  //       id: 'MP001',
  //       type: 'person',
  //       name: 'Rajesh Kumar',
  //       reportedBy: 'Sunita Kumar (Wife)',
  //       location: 'Mahakaleshwar Temple',
  //       time: '2 hours ago',
  //       status: 'active',
  //       priority: 'high',
  //       description: 'Male, 45 years, wearing white kurta and blue jeans. Last seen near temple entrance.'
  //     },
  //     {
  //       id: 'MP002',
  //       type: 'person',
  //       name: 'Unidentified Male',
  //       reportedBy: 'Amit Sharma',
  //       location: 'Railway Station',
  //       time: '4 hours ago',
  //       status: 'investigating',
  //       priority: 'medium',
  //       description: 'Approx 35 years, black shirt, blue trousers. Reported missing near station.'
  //     },
  //     {
  //       id: 'MP003',
  //       type: 'person',
  //       name: 'Priya Patel',
  //       reportedBy: 'Ramesh Patel (Father)',
  //       location: 'Shipra Ghat',
  //       time: '1 day ago',
  //       status: 'found',
  //       priority: 'high',
  //       description: 'Female, 8 years, wearing red dress. Found safe at nearby police station.'
  //     }
  //   ];

  //   const mockAlerts: Alert[] = [
  //     {
  //       id: 'A001',
  //       type: 'match',
  //       message: 'Facial recognition match detected for case MP001',
  //       time: '5 minutes ago',
  //       location: 'CCTV Camera #47 - Market Area',
  //       caseId: 'MP001'
  //     },
  //     {
  //       id: 'A002',
  //       type: 'sighting',
  //       message: 'Possible sighting reported by citizen',
  //       time: '15 minutes ago',
  //       location: 'Bus Stand Area',
  //       caseId: 'MP002'
  //     },
  //     {
  //       id: 'A003',
  //       type: 'emergency',
  //       message: 'New high-priority missing person report',
  //       time: '30 minutes ago',
  //       location: 'Temple Complex'
  //     }
  //   ];

  //   setCases(mockCases);
  //   setAlerts(mockAlerts);
  // }, []);
  useEffect(() => {
  const fetchReports = async () => {
    const res = await fetch('http://localhost:5050/api/reports');
    const data = await res.json();
    const formattedCases = data.map((r: any) => ({
      id: r._id,
      type: 'person',
      name: r.personName,
      reportedBy: `${r.reporterName} (${r.reporterRelation})`,
      location: r.lastSeenLocation,
      time: new Date(r.lastSeenTime).toLocaleString(),
      status: r.status,
      priority: 'high',
      description: r.description,
      // photo: r.photos?.[0] || ''
      photo: r.photos?.[0] ? `http://localhost:5050/uploads/${r.photos[0]}` : undefined
    }));
    setCases(formattedCases);
  };
  fetchReports();
}, []);


  const stats = [
    { label: 'Active Cases', value: 12, icon: <Users className="w-6 h-6" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: 'Found Today', value: 8, icon: <CheckCircle className="w-6 h-6" />, color: 'text-green-400', bg: 'bg-green-500/20' },
    { label: 'Alerts', value: 5, icon: <AlertTriangle className="w-6 h-6" />, color: 'text-red-400', bg: 'bg-red-500/20' },
    { label: 'Cameras Online', value: 247, icon: <Camera className="w-6 h-6" />, color: 'text-purple-400', bg: 'bg-purple-500/20' }
  ];

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || case_.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400 bg-red-500/20';
      case 'found': return 'text-green-400 bg-green-500/20';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'match': return <Target className="w-5 h-5 text-green-400" />;
      case 'sighting': return <Eye className="w-5 h-5 text-blue-400" />;
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                  <div>
                    <h1 className="text-xl font-bold text-white">Police Dashboard</h1>
                    <p className="text-sm text-gray-300">Simhastha Ujjain Surveillance</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Bell className="w-6 h-6 text-white cursor-pointer hover:text-blue-400 transition-colors" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                </div>
                <Settings className="w-6 h-6 text-white cursor-pointer hover:text-blue-400 transition-colors" />
                <motion.button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="container mx-auto px-6 py-6">
          <div className="flex gap-2 mb-8">
            {[
              { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
              { id: 'cases', label: 'Cases', icon: <FileText className="w-4 h-4" /> },
              { id: 'surveillance', label: 'Surveillance', icon: <Monitor className="w-4 h-4" /> },
              { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/30 text-white border border-blue-400/50'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                          <div className={stat.color}>
                            {stat.icon}
                          </div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-300">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Recent Cases */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Recent Cases
                    </h3>
                    <div className="space-y-4">
                      {cases.slice(0, 3).map((case_) => (
                        <div key={case_.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                          <div className="flex-shrink-0">
                            {case_.type === 'person' ? (
                              <User className="w-8 h-8 text-blue-400" />
                            ) : (
                              <Package className="w-8 h-8 text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{case_.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(case_.status)}`}>
                                {case_.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">{case_.location}</p>
                          </div>
                          <div className="text-xs text-gray-500">{case_.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Alerts */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Live Alerts
                    </h3>
                    <div className="space-y-4">
                      {alerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                          <div className="flex-shrink-0 mt-1">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white mb-1">{alert.message}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {alert.location}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{alert.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cases Tab */}
            {activeTab === 'cases' && (
              <motion.div
                key="cases"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Search and Filter */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                        placeholder="Search cases by name or ID..."
                      />
                    </div>
                    <div className="flex gap-4">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      >
                        <option value="all" className="bg-gray-800">All Status</option>
                        <option value="active" className="bg-gray-800">Active</option>
                        <option value="investigating" className="bg-gray-800">Investigating</option>
                        <option value="found" className="bg-gray-800">Found</option>
                      </select>
                      <motion.button
                        className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-white transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Cases List */}
                <div className="space-y-4">
                  {filteredCases.map((case_) => (
                    <motion.div
                      key={case_.id}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      layout
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {case_.type === 'person' ? (
                              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-400" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-purple-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-lg font-semibold text-white">{case_.name}</h4>
                              <span className="text-sm text-gray-400">#{case_.id}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                                {/* {case_.status.toUpperCase()} */}
                                {case_.status ? case_.status.toUpperCase() : 'UNKNOWN'}

                              </span>
                            </div>
                            <p className="text-sm text-gray-300">Reported by: {case_.reportedBy}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getPriorityColor(case_.priority)}`}>
                            {case_.priority.toUpperCase()} PRIORITY
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{case_.time}</div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4 text-yellow-400" />
                          Last seen: {case_.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="w-4 h-4 text-blue-400" />
                          {case_.time}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-4">{case_.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {/* <motion.button
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-400 text-sm transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button> */}
                            <motion.button
                            onClick={() => setSelectedCase(case_)}
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-400 text-sm transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button>

                          <motion.button
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-400 text-sm transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Update Status
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Radio className="w-3 h-3" />
                          Broadcasting to all units
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Surveillance Tab */}
            {activeTab === 'surveillance' && (
              <motion.div
                key="surveillance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Monitor className="w-6 h-6 text-blue-400" />
                    Live Surveillance Feed
                  </h3>
                  
                  {/* Camera Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((camera) => (
                      <div key={camera} className="bg-white/5 rounded-xl p-4">
                        <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                          <Camera className="w-12 h-12 text-gray-600" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-white">Camera #{camera.toString().padStart(2, '0')}</h4>
                            <p className="text-xs text-gray-400">Temple Area - Zone {camera}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-400">Live</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-yellow-400" />
                    Real-time Alerts
                  </h3>
                  
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-white">{alert.message}</span>
                            {alert.caseId && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                {alert.caseId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-400 text-xs transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Investigate
                          </motion.button>
                          <motion.button
                            className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-lg text-gray-400 text-xs transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Dismiss
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Case Details Modal */}
            {/* Case Details Modal */}
{selectedCase && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative">
      <button
        onClick={() => setSelectedCase(null)}
        className="absolute top-4 right-4 text-gray-600 hover:text-black"
      >
        ✖
      </button>

      <h2 className="text-2xl font-bold mb-4">Case Details: {selectedCase.name}</h2>

      <div className="space-y-2 text-gray-700">
        <p><strong>ID:</strong> {selectedCase.id}</p>
        <p><strong>Reported By:</strong> {selectedCase.reportedBy}</p>
        <p><strong>Location:</strong> {selectedCase.location}</p>
        <p><strong>Time:</strong> {selectedCase.time}</p>
        <p><strong>Status:</strong> {selectedCase.status}</p>
        <p><strong>Priority:</strong> {selectedCase.priority}</p>
        <p><strong>Description:</strong> {selectedCase.description}</p>
      </div>

      {selectedCase.photo ? (
        <div className="mt-4">
          <img
            src={selectedCase.photo}
            alt={selectedCase.name || 'Missing Person'}
            className="rounded-lg max-h-64 object-cover"
          />
        </div>
      ) : null}
    </div>
  </div>
)}


    </div>
    
  );
  
}
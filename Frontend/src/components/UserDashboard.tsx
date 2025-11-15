import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  FileText, 
  Plus, 
  Eye, 
  Clock, 
  MapPin, 
  ArrowLeft,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Package,
  UserCheck,
  X,
  Image as ImageIcon,
  Phone
} from 'lucide-react';

interface UserDashboardProps {
  onBack: () => void;
  onCreateReport: () => void;
  onLogout: () => void;
}

interface Report {
  id: string;
  type: 'person' | 'item';
  name: string;
  status: 'active' | 'found' | 'investigating';
  createdAt: string;
  lastSeenLocation: string;
  description: string;
  // Full report data from backend
  fullData?: {
    _id: string;
    reporterName: string;
    reporterPhone: string;
    reporterRelation?: string;
    personName: string;
    personAge: number;
    personGender: string;
    personHeight?: string;
    personClothing?: string;
    description?: string;
    lastSeenLocation: string;
    lastSeenTime: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export default function UserDashboard({ onBack, onCreateReport, onLogout }: UserDashboardProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'found' | 'investigating'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report['fullData'] | null>(null);

  // Get user data from localStorage
  const userData = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          name: user.fullName || 'User',
          email: user.email || '',
          phone: user.phone || ''
        };
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    return {
      name: 'User',
      email: '',
      phone: ''
    };
  })();

  // Fetch user reports
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setIsLoading(false);
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
        const response = await fetch(`${apiUrl}/api/reports/my-reports`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        
        // Map backend report structure to frontend Report interface
        const mappedReports: Report[] = data.map((report: any) => ({
          id: report._id || report.id,
          type: 'person' as const, // All reports are missing person reports
          name: report.personName || 'Unknown',
          status: 'active' as const, // Default status since backend doesn't have status field
          createdAt: report.createdAt || new Date().toISOString(),
          lastSeenLocation: report.lastSeenLocation || 'Unknown location',
          description: report.description || 
            `${report.personAge ? `${report.personAge} years old` : ''} ${report.personGender || ''}${report.personClothing ? `. Last seen wearing: ${report.personClothing}` : ''}`.trim(),
          // Store full report data for detail view
          fullData: report
        }));
        
        setReports(mappedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4" />;
      case 'found': return <CheckCircle className="w-4 h-4" />;
      case 'investigating': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
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
                <motion.button
                  onClick={onBack}
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                  whileHover={{ x: -4 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Home
                </motion.button>
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-red-400" />
                  <div>
                    <h1 className="text-xl font-bold text-white">My Reports</h1>
                    <p className="text-sm text-gray-300">Welcome back, {userData.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={onCreateReport}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  New Report
                </motion.button>
                <motion.button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    onLogout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-xl text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="space-y-8"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-red-500/20">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {reports.filter(r => r.status === 'active').length}
                </div>
                <div className="text-sm text-gray-300">Active Reports</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {reports.filter(r => r.status === 'found').length}
                </div>
                <div className="text-sm text-gray-300">Found</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{reports.length}</div>
                <div className="text-sm text-gray-300">Total Reports</div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                    placeholder="Search your reports..."
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                >
                  <option value="all" className="bg-gray-800">All Status</option>
                  <option value="active" className="bg-gray-800">Active</option>
                  <option value="investigating" className="bg-gray-800">Investigating</option>
                  <option value="found" className="bg-gray-800">Found</option>
                </select>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6">Your Reports</h2>
              
              {isLoading ? (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading your reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
                  <p className="text-gray-300 mb-6">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'No reports match your search criteria.' 
                      : 'You haven\'t created any reports yet.'}
                  </p>
                  <motion.button
                    onClick={onCreateReport}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-white transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Report
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <motion.div
                      key={report.id}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
                      whileHover={{ scale: 1.01 }}
                      layout
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {report.type === 'person' ? (
                              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-red-400" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-purple-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-lg font-semibold text-white">{report.name}</h4>
                              <span className="text-sm text-gray-400">#{report.id}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(report.status)}`}>
                                {getStatusIcon(report.status)}
                                {report.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">
                              Missing Person
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {formatDate(report.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4 text-yellow-400" />
                          Last seen: {report.lastSeenLocation}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          Reported: {formatDate(report.createdAt)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-4">{report.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <motion.button
                          onClick={() => setSelectedReport(report.fullData || null)}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-400 text-sm transition-all flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </motion.button>
                        <div className="text-xs text-gray-500">
                          Report ID: {report.id.substring(0, 8)}...
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Report Details</h2>
                    <p className="text-sm text-gray-400">Missing Person Report</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6 text-gray-400" />
                </motion.button>
              </div>

              <div className="space-y-6">
                {/* Missing Person Information */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-red-400" />
                    Missing Person Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Full Name</p>
                      <p className="text-white font-semibold">{selectedReport.personName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Age</p>
                      <p className="text-white font-semibold">{selectedReport.personAge} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Gender</p>
                      <p className="text-white font-semibold capitalize">{selectedReport.personGender}</p>
                    </div>
                    {selectedReport.personHeight && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Height</p>
                        <p className="text-white font-semibold">{selectedReport.personHeight}</p>
                      </div>
                    )}
                    {selectedReport.personClothing && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400 mb-1">Clothing Description</p>
                        <p className="text-white">{selectedReport.personClothing}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Seen Information */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    Last Seen Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Location</p>
                      <p className="text-white font-semibold">{selectedReport.lastSeenLocation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Date & Time</p>
                      <p className="text-white font-semibold">
                        {formatDate(selectedReport.lastSeenTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reporter Information */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    Reporter Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Reporter Name</p>
                      <p className="text-white font-semibold">{selectedReport.reporterName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone Number
                      </p>
                      <p className="text-white font-semibold">{selectedReport.reporterPhone}</p>
                    </div>
                    {selectedReport.reporterRelation && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400 mb-1">Relationship</p>
                        <p className="text-white">{selectedReport.reporterRelation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Description */}
                {selectedReport.description && (
                  <div className="bg-white/5 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Additional Description</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedReport.description}</p>
                  </div>
                )}

                {/* Photos */}
                {selectedReport.photos && selectedReport.photos.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-green-400" />
                      Photos ({selectedReport.photos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReport.photos.map((photo, idx) => (
                        <motion.div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-white/20"
                          whileHover={{ scale: 1.05 }}
                        >
                          <img
                            src={`http://localhost:5050/uploads/${photo}`}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Report Metadata */}
                <div className="bg-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Report Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Report ID</p>
                      <p className="text-white font-mono">{selectedReport._id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Submitted On</p>
                      <p className="text-white">{formatDate(selectedReport.createdAt)}</p>
                    </div>
                    {selectedReport.updatedAt && (
                      <div>
                        <p className="text-gray-400 mb-1">Last Updated</p>
                        <p className="text-white">{formatDate(selectedReport.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
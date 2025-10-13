import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, 
  Upload, 
  MapPin, 
  ArrowLeft,
  AlertTriangle,
  Camera,
  FileText,
  User
} from 'lucide-react';

interface MissingPersonReportProps {
  onBack: () => void;
}

export default function MissingPersonReport({ onBack }: MissingPersonReportProps) {
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterPhone: '',
    reporterRelation: '',
    lastSeenLocation: '',
    lastSeenTime: '',
    description: '',
    personName: '',
    personAge: '',
    personGender: '',
    personHeight: '',
    personClothing: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  
    // Simulate form submission
  //   setTimeout(() => {
  //     alert(`Missing person report submitted successfully! Report ID: MP${Date.now()}`);
  //     setIsSubmitting(false);
  //   }, 2000);
  // };
//   const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setIsSubmitting(true);

//   try {
//     const form = new FormData();
//     Object.entries(formData).forEach(([key, value]) => form.append(key, value as string));
//     photos.forEach(photo => form.append('photos', photo));

//     // form.append('user', loggedInUserId);

//     const res = await fetch('http://localhost:5050/api/reports', {
//       method: 'POST',
//       body: form
//     });
//     const data = await res.json();
//     alert('Report submitted successfully!');
//     setIsSubmitting(false);
//   } catch (err) {
//     console.log(err);
//     setIsSubmitting(false);
//   }
// };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => form.append(key, value as string));
    photos.forEach(photo => form.append('photos', photo));

    // 👇 Add Authorization header with token
    const res = await fetch('http://localhost:5050/api/reports', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: form,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to submit report');

    alert('Report submitted successfully!');
  } catch (err: any) {
    console.error(err);
    alert(err.message);
  } finally {
    setIsSubmitting(false);
  }
};


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 py-12 px-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </motion.button>

        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <UserCheck className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Report Missing Person</h1>
            <p className="text-xl text-gray-300">Help us locate your loved ones quickly and safely</p>
          </div>

          {/* Main Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Reporter Information */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                  Reporter Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Relationship to Missing Person
                    </label>
                    <input
                      type="text"
                      value={formData.reporterRelation}
                      onChange={(e) => setFormData({ ...formData, reporterRelation: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="e.g., Father, Mother, Friend, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Missing Person Details */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <User className="w-6 h-6 text-red-400" />
                  Missing Person Details
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.personName}
                      onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={formData.personAge}
                      onChange={(e) => setFormData({ ...formData, personAge: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Age in years"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.personGender}
                      onChange={(e) => setFormData({ ...formData, personGender: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="" className="bg-gray-800">Select gender</option>
                      <option value="male" className="bg-gray-800">Male</option>
                      <option value="female" className="bg-gray-800">Female</option>
                      <option value="other" className="bg-gray-800">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height (approx.)
                    </label>
                    <input
                      type="text"
                      value={formData.personHeight}
                      onChange={(e) => setFormData({ ...formData, personHeight: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="e.g., 5'6&quot;, 170cm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Clothing Description
                    </label>
                    <textarea
                      value={formData.personClothing}
                      onChange={(e) => setFormData({ ...formData, personClothing: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                      rows={3}
                      placeholder="Describe what they were wearing when last seen..."
                    />
                  </div>
                </div>
              </div>

              {/* Last Seen Information */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-yellow-400" />
                  Last Seen Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.lastSeenLocation}
                      onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="e.g., Mahakaleshwar Temple, Railway Station"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.lastSeenTime}
                      onChange={(e) => setFormData({ ...formData, lastSeenTime: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Any additional details that might help in the search..."
                />
              </div>

              {/* Photo Upload */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <Camera className="w-5 h-5 text-green-400" />
                  Upload Photos (Optional)
                </h3>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">
                    Upload recent photos to help with identification
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white cursor-pointer transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Photos
                  </label>
                  {photos.length > 0 && (
                    <p className="text-green-400 mt-2">
                      {photos.length} photo(s) selected
                    </p>
                  )}
                </div>
              </div>

              {/* Emergency Notice */}
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-red-200 font-semibold mb-2">Emergency Notice</h4>
                    <p className="text-red-200/80 text-sm">
                      If this is a life-threatening emergency, please call <strong>100</strong> immediately. 
                      This form is for non-emergency missing person reports during Simhastha Ujjain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Submit Missing Person Report
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

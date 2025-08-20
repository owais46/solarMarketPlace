'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface UploadedFile {
  file: File;
  preview: string;
  extractedText?: string;
}

export default function BillUploadPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    // Simulate OCR text extraction
    // In production, you would integrate with an OCR service like Tesseract.js or a cloud OCR API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `Sample extracted text from ${file.name}:
    
Electric Bill - Monthly Statement
Account Number: 123-456-789
Service Period: Jan 1, 2024 - Jan 31, 2024
Total Amount Due: $156.78
KWh Used: 1,234 kWh
Rate per KWh: $0.12
Previous Balance: $0.00
Current Charges: $148.08
Taxes & Fees: $8.70
Due Date: Feb 15, 2024`;
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setExtracting(true);

    try {
      for (const uploadedFile of uploadedFiles) {
        // Upload file to Supabase Storage
        const fileExt = uploadedFile.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `bills/${profile?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bills')
          .upload(filePath, uploadedFile.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('bills')
          .getPublicUrl(filePath);

        // Extract text if it's an image
        let extractedText = '';
        if (uploadedFile.file.type.startsWith('image/')) {
          extractedText = await extractTextFromImage(uploadedFile.file);
        }

        // Save to database
        const { error: dbError } = await supabase
          .from('bills')
          .insert([
            {
              user_id: profile?.id,
              file_url: publicUrl,
              file_name: uploadedFile.file.name,
              extracted_text: extractedText
            }
          ]);

        if (dbError) throw dbError;
      }

      toast.success('Bills uploaded successfully!');
      router.push('/bills');
    } catch (error: any) {
      console.error('Error uploading bills:', error);
      toast.error(error.message || 'Error uploading bills');
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Bills
          </h1>
          <p className="text-gray-600">
            Upload your electricity bills to get personalized solar quotes and savings analysis
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            
            {isDragActive ? (
              <p className="text-lg text-orange-600 font-medium">
                Drop your bills here...
              </p>
            ) : (
              <div>
                <p className="text-lg text-gray-700 font-medium mb-2">
                  Drag and drop your bills here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PNG, JPG, GIF, and PDF files
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Selected Files ({uploadedFiles.length})
            </h2>
            
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {uploadedFile.file.type.startsWith('image/') ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upload Button */}
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>
                    {extracting ? 'Processing Text...' : 'Uploading...'}
                  </span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Upload Bills</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 bg-blue-50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            What happens after upload?
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center space-x-2">
              <CheckIcon className="h-4 w-4 text-blue-600" />
              <span>We'll analyze your electricity usage patterns</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckIcon className="h-4 w-4 text-blue-600" />
              <span>Extract key information like usage and costs</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckIcon className="h-4 w-4 text-blue-600" />
              <span>Match you with suitable solar installers</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckIcon className="h-4 w-4 text-blue-600" />
              <span>Generate personalized savings estimates</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
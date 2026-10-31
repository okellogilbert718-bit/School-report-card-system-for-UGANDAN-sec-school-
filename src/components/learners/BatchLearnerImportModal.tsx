import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Learner, Programme } from '../../types';
import { parseCSV, downloadFile, exportToCSV } from '../../utils/academicCalculations';
import { X, Upload, Download, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface BatchLearnerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedLearnerRow {
  fullName: string;
  admissionNo: string;
  lin: string;
  gender: 'Male' | 'Female';
  programme: Programme;
  classCode: string;
  stream: string;
  section: string;
  parentName: string;
  parentPhone: string;
  isValid: boolean;
  validationError?: string;
}

export const BatchLearnerImportModal: React.FC<BatchLearnerImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { schoolProfile, classes, subjects, batchAddLearners } = useApp();
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedLearnerRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      'Full Name',
      'Admission No',
      'LIN',
      'Gender',
      'Programme',
      'Class Code',
      'Stream',
      'Section',
      'Parent Name',
      'Parent Phone',
    ];

    const sampleRows = [
      ['Wasswa Denis', 'STP/2026/088', 'LIN-055102', 'Male', 'O_LEVEL', 'S.4', 'Red', 'Muteesa House', 'Mr. Robert Kato', '+256772111222'],
      ['Babirye Joan', 'STP/2026/089', 'LIN-055103', 'Female', 'O_LEVEL', 'S.4', 'Red', 'Kabaleega House', 'Mrs. Sarah Lule', '+256701333444'],
      ['Okello Patrick', 'STP/2026/090', 'LIN-055104', 'Male', 'A_LEVEL', 'S.6', 'Science East', 'Mwanga House', 'Dr. Ronald Okello', '+256752555666'],
    ];

    const csvData = exportToCSV(headers, sampleRows);
    const safeSchool = (schoolProfile?.name || 'School').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(`${safeSchool}_Learner_Batch_Template.csv`, csvData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCSV(text);
    };
    reader.readAsText(file);
  };

  const processCSV = (text: string) => {
    const rawRows = parseCSV(text);
    const parsed: ParsedLearnerRow[] = rawRows.map((row) => {
      const fullName = row['Full Name'] || row['FullName'] || row['Name'] || '';
      const admissionNo = row['Admission No'] || row['AdmissionNo'] || row['AdmNo'] || '';
      const lin = row['LIN'] || row['Lin'] || '';
      const genderRaw = (row['Gender'] || 'Male').toLowerCase();
      const gender: 'Male' | 'Female' = genderRaw.startsWith('f') ? 'Female' : 'Male';
      const progRaw = (row['Programme'] || '').toUpperCase();
      const programme: Programme = progRaw.includes('A') || progRaw.includes('ADVANCED') ? 'A_LEVEL' : 'O_LEVEL';
      const classCode = row['Class Code'] || row['Class'] || 'S.4';
      const stream = row['Stream'] || 'Red';
      const section = row['Section'] || row['House'] || 'Muteesa House';
      const parentName = row['Parent Name'] || row['Parent'] || '';
      const parentPhone = row['Parent Phone'] || row['Phone'] || '+256 7';

      let isValid = true;
      let validationError = '';

      if (!fullName) {
        isValid = false;
        validationError = 'Missing Full Name';
      } else if (!lin) {
        isValid = false;
        validationError = 'Missing National LIN';
      }

      return {
        fullName,
        admissionNo: admissionNo || `STP/2026/${Math.floor(100 + Math.random() * 900)}`,
        lin,
        gender,
        programme,
        classCode,
        stream,
        section,
        parentName,
        parentPhone,
        isValid,
        validationError,
      };
    });

    setParsedRows(parsed);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const learnersToCreate: Omit<Learner, 'id'>[] = validRows.map((r) => {
      // Find matching class
      const matchedClass = classes.find(
        (c) =>
          c.code.toLowerCase() === r.classCode.toLowerCase() ||
          c.name.toLowerCase().includes(r.classCode.toLowerCase())
      ) || classes.find((c) => c.programme === r.programme) || classes[0];

      // Assign default compulsory subjects for that programme
      const allocatedSubjectIds = subjects
        .filter((s) => s.programme === r.programme && s.isCompulsory)
        .map((s) => s.id);

      return {
        admissionNo: r.admissionNo,
        lin: r.lin,
        fullName: r.fullName,
        gender: r.gender,
        dob: '2008-01-01',
        programme: r.programme,
        classId: matchedClass.id,
        stream: r.stream || matchedClass.streams[0] || 'Blue',
        section: r.section || 'Muteesa House',
        enrolmentStatus: 'Active',
        parentName: r.parentName,
        parentPhone: r.parentPhone,
        photoUrl: '',
        allocatedSubjectIds,
        daysPresent: 75,
        totalDays: 78,
        conduct: 'Respectful and focused',
      };
    });

    const importedCount = batchAddLearners(learnersToCreate);
    setImportStatus(`Successfully registered ${importedCount} learners!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold">Batch Learner Registration (CSV / Excel)</h3>
            <p className="text-xs text-slate-300">
              Bulk register students into classes, streams, and national UNEB records
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importStatus && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Step 1 & Step 2 Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Step 1
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2">Get Excel / CSV Template</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Download the official headers including Full Name, LIN, Admission No, Class Code, and Stream.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-xs transition"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {/* Step 2: Upload CSV */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                  Step 2
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2">Upload Completed CSV</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Select your saved CSV file to preview student records before finalizing registration.
                </p>
              </div>
              <label className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>{fileName ? `File: ${fileName}` : 'Choose CSV File...'}</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Validation & Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Parsed <span className="font-bold text-slate-900">{parsedRows.length}</span> Rows
                  ({parsedRows.filter((r) => r.isValid).length} Valid,{' '}
                  <span className="text-rose-600">
                    {parsedRows.filter((r) => !r.isValid).length} with errors
                  </span>
                  )
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Full Name</th>
                      <th className="px-3 py-2">LIN</th>
                      <th className="px-3 py-2">Adm No</th>
                      <th className="px-3 py-2">Prog</th>
                      <th className="px-3 py-2">Class &amp; Stream</th>
                      <th className="px-3 py-2">Parent / Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/60'}
                      >
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5" /> {row.validationError}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{row.lin}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{row.admissionNo}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                              row.programme === 'O_LEVEL'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {row.programme === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.classCode} - {row.stream}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {row.parentName} ({row.parentPhone})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 &&
              `${parsedRows.filter((r) => r.isValid).length} ready to be inserted`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedRows.filter((r) => r.isValid).length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
            >
              Confirm &amp; Register Learners
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

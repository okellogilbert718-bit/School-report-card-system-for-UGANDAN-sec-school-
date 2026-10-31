import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolLogo } from '../common/SchoolLogo';
import {
  Building2,
  Save,
  Upload,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

export const SchoolSettings: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, resetToDefaults } = useApp();

  const [formData, setFormData] = useState(schoolProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageError, setImageError] = useState('');

  const handleChange = (
    field: keyof typeof schoolProfile,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setImageError('Logo image must be smaller than 2MB.');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with configured school name */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              System Settings &bull; School Identity
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            School Profile &amp; Official Branding
          </h2>
          <p className="text-xs text-slate-500">
            Configure school name, motto, official stamp details, and emblem for report cards
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Reset all demo data back to default Ugandan school settings?')) {
              resetToDefaults();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>School profile details and report settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo & Emblem Upload Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>School Badge / Crest Emblem</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="shrink-0 text-center">
              <SchoolLogo
                url={formData.logoUrl}
                name={formData.name}
                size="xl"
                className="mx-auto"
              />
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {formData.logoUrl ? 'Custom Uploaded' : 'Default Crest'}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Upload School Badge (PNG or JPEG)
              </label>
              <p className="text-xs text-slate-500 leading-relaxed">
                This emblem is prominently centered in official report-card headers, broadsheets, and office publications.
              </p>

              {imageError && (
                <p className="text-xs text-rose-600 font-medium">{imageError}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Logo File...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                  >
                    Use Default Vector Crest
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Institution Details */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>School Identity &amp; Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official School Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Motto
              </label>
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => handleChange('motto', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal Address &amp; Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telephone Numbers
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Headteacher & Term Circular Settings */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Headteacher Circular &amp; Report Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headteacher Name
              </label>
              <input
                type="text"
                value={formData.headTeacherName}
                onChange={(e) => handleChange('headTeacherName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headteacher Title
              </label>
              <input
                type="text"
                value={formData.headTeacherTitle}
                onChange={(e) => handleChange('headTeacherTitle', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Term Begins Date
              </label>
              <input
                type="text"
                value={formData.nextTermBegins}
                onChange={(e) => handleChange('nextTermBegins', e.target.value)}
                placeholder="e.g. 2026-09-14"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fees &amp; Requirements Note
              </label>
              <textarea
                rows={2}
                value={formData.feesBalanceNote}
                onChange={(e) => handleChange('feesBalanceNote', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="showClassPos"
                checked={formData.showClassPosition}
                onChange={(e) => handleChange('showClassPosition', e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="showClassPos" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Display Class Stream Position on Report Cards
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Save School Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { PackageImageWizard } from '@/components/admin/PackageImageWizard';
import ConfirmationModal from '@/components/cart/CartModal/components/ConfirmationModal';
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';

interface PackageImageItem {
  _id: string;
  name: string;
  image: { secure_url: string };
  packageTier?: 'classic' | 'premium' | 'vip';
  category?: string;
}

const tabs = [
  { key: 'classic', label: 'كلاسيك', match: (img: PackageImageItem) => img.packageTier === 'classic' },
  { key: 'premium', label: 'بريميوم', match: (img: PackageImageItem) => img.packageTier === 'premium' },
  { key: 'vip', label: 'VIP', match: (img: PackageImageItem) => img.packageTier === 'vip' },
  { key: 'عيد ميلاد', label: 'عيد ميلاد', match: (img: PackageImageItem) => img.category === 'عيد ميلاد' },
  { key: 'حفل تخرج', label: 'حفل تخرج', match: (img: PackageImageItem) => img.category === 'حفل تخرج' },
  { key: 'حفل زفاف', label: 'حفل زفاف', match: (img: PackageImageItem) => img.category === 'حفل زفاف' },
];

export default function AdminPackageImagesPage() {
  const { toast } = useToast();
  const [images, setImages] = useState<PackageImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [showWizard, setShowWizard] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getPackageImages();
      setImages(data as unknown as PackageImageItem[]);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل في جلب صور الباقات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const activeTabConfig = tabs.find(t => t.key === activeTab)!;
  const visibleImages = images.filter(activeTabConfig.match);

  const startRename = (img: PackageImageItem) => {
    setRenamingId(img._id);
    setRenameValue(img.name);
  };

  const confirmRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await adminAPI.updatePackageImage(id, { name: renameValue.trim() });
      setImages(prev => prev.map(img => img._id === id ? { ...img, name: renameValue.trim() } : img));
      setRenamingId(null);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل في تحديث الاسم', variant: 'destructive' });
    }
  };

  const handleDelete = (id: string) => {
    setImageToDelete(id);
  };

  const handleConfirmDelete = async () => {
    const id = imageToDelete;
    setImageToDelete(null);
    if (!id) return;

    try {
      setDeletingId(id);
      await adminAPI.deletePackageImage(id);
      setImages(prev => prev.filter(img => img._id !== id));
      toast({ title: 'تم', description: 'تم حذف التصميم بنجاح', variant: 'default' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل في حذف التصميم', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminSidebar>
      <div className="container mx-auto px-8 py-12" dir="rtl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">صور الباقات</h1>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C09B52] text-white rounded-lg hover:bg-[#A0884A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة تصميم
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#C09B52] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#C09B52] animate-spin" />
          </div>
        ) : visibleImages.length === 0 ? (
          <div className="text-center text-gray-400 py-16">لا توجد تصاميم في هذا التصنيف</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {visibleImages.map(img => (
              <div key={img._id} className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
                <div className="aspect-[3/4] bg-gray-800">
                  <img src={img.image.secure_url} alt={img.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 space-y-2">
                  {renamingId === img._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-[#C09B52]"
                        autoFocus
                      />
                      <button onClick={() => confirmRename(img._id)} className="text-green-400 hover:text-green-300">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setRenamingId(null)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-white text-sm truncate" title={img.name}>{img.name}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => startRename(img)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 text-xs"
                    >
                      <Pencil className="w-3 h-3" />
                      إعادة تسمية
                    </button>
                    <button
                      onClick={() => handleDelete(img._id)}
                      disabled={deletingId === img._id}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 text-xs disabled:opacity-50"
                    >
                      {deletingId === img._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWizard && (
        <PackageImageWizard
          onClose={() => setShowWizard(false)}
          onCreated={fetchImages}
        />
      )}

      <ConfirmationModal
        isOpen={!!imageToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setImageToDelete(null)}
        title="حذف التصميم"
        message="هل أنت متأكد من حذف هذا التصميم؟"
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </AdminSidebar>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  BookOpen, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Check, 
  Pencil, 
  X, 
  RotateCcw, 
  ChevronRight,
  PlusCircle,
  Trash2,
  Tag,
  AlertOctagon,
  ExternalLink,
  Cpu,
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  RefreshCw,
  Eye,
  Upload,
  FileUp,
  FileCheck2,
  CheckCheck,
  Ban,
  FileQuestion,
  HelpCircle,
  Download,
  Image as ImageIcon,
  FileType,
  UserCheck
} from 'lucide-react';

const INITIAL_CONTENT = `Unlock unprecedented hyper-growth with our revolutionary, ground-breaking AI solution. We guarantee 10x ROI overnight, crushing the outdated competition without compromise! Join 100,000+ top enterprises that blindly trust our proprietary cloud algorithms to dominate their industry.`;

// Default brand rules stored if nothing is in localStorage
const DEFAULT_BRAND_RULES = [
  {
    id: 'rule-1',
    name: 'Unverified Guarantees',
    description: 'Avoid promising absolute overnight financial returns without verifiable audit disclaimers.',
    type: 'Factual Claim',
    severity: 'High',
    keywords: 'guarantee 10x ROI overnight',
    suggestedFix: 'help teams accelerate ROI and productivity by up to 3x based on customer benchmarks',
    active: true,
  },
  {
    id: 'rule-2',
    name: 'Hostile Competitor Mention',
    description: 'Preflight brand guidelines prohibit hostile competitor callouts. Tone should remain respectful, objective, and solution-focused.',
    type: 'Tone',
    severity: 'High',
    keywords: 'crushing the outdated competition without compromise!',
    suggestedFix: 'outperforming traditional legacy workflows with seamless adaptability.',
    active: true,
  },
  {
    id: 'rule-3',
    name: 'Tech Buzzword Cliché',
    description: 'Hyperbolic buzzwords reduce trust and dilute technical clarity. Brand voice favors crisp, confident, and direct value statements.',
    type: 'Banned Words',
    severity: 'Low',
    keywords: 'revolutionary, ground-breaking AI solution',
    suggestedFix: 'intelligent workflow automation platform',
    active: true,
  },
  {
    id: 'rule-4',
    name: 'Unsubstantiated Trust Claims',
    description: '"Blindly trust" conveys a lack of governance or transparency, which directly conflicts with enterprise compliance standards.',
    type: 'Tone',
    severity: 'Medium',
    keywords: 'blindly trust our proprietary cloud algorithms',
    suggestedFix: 'rely on our SOC2-compliant enterprise security architecture',
    active: true,
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardMode, setDashboardMode] = useState('text'); // 'text' | 'image'
  const [purpose, setPurpose] = useState('Announce a product launch to enterprise clients');
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [isChecking, setIsChecking] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [editingWarningId, setEditingWarningId] = useState(null);
  const [customEditText, setCustomEditText] = useState('');
  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [modelUsed, setModelUsed] = useState(null);
  const [currentReviewId, setCurrentReviewId] = useState(null);

  // Image Upload Creative State (Part 2)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageFindings, setImageFindings] = useState([]);
  const [hasScannedImage, setHasScannedImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const imageInputRef = useRef(null);

  // Review History State (Loaded from Backend SQLite database)
  const [reviewsList, setReviewsList] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isLoadingSingleReview, setIsLoadingSingleReview] = useState(false);

  // PDF Brand Guidelines State (Exclusively for rule creation)
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractionSuccess, setPdfExtractionSuccess] = useState(null);
  const [proposedRules, setProposedRules] = useState([]);
  const [editingProposedId, setEditingProposedId] = useState(null);
  const [editingRuleData, setEditingRuleData] = useState({});
  const fileInputRef = useRef(null);

  // Backend API URL from environment variable or default local
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Brand Rules state with localStorage persistence
  const [rules, setRules] = useState(() => {
    try {
      const saved = localStorage.getItem('preflight_brand_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load rules from localStorage', e);
    }
    return DEFAULT_BRAND_RULES;
  });

  // New Rule Form State (Manual)
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleType, setNewRuleType] = useState('Banned Words');
  const [newRuleSeverity, setNewRuleSeverity] = useState('Medium');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleSuggestedFix, setNewRuleSuggestedFix] = useState('');

  // Persist rules to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('preflight_brand_rules', JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save rules to localStorage', e);
    }
  }, [rules]);

  // Fetch reviews from FastAPI SQLite backend
  const fetchReviewsHistory = async () => {
    setIsLoadingReviews(true);
    setReviewsError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/reviews`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}`);
      }
      const data = await response.json();
      setReviewsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load review history:', err);
      let msg = err.message || 'Failed to connect to backend server.';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        msg = `Cannot connect to Preflight backend at ${BACKEND_URL}. Please ensure the server is running.`;
      }
      setReviewsError(msg);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Fetch reviews whenever the history tab is activated
  useEffect(() => {
    if (activeTab === 'history') {
      fetchReviewsHistory();
    }
  }, [activeTab]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Real backend Gemini content check (Text)
  const handleRunCheck = async () => {
    if (!content.trim()) return;
    setIsChecking(true);
    setApiError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/check-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          purpose: purpose,
          brand_rules: rules,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server returned ${response.status}: ${response.statusText}`);
      }

      const formattedFindings = (data.findings || []).map((finding, idx) => ({
        id: `f-${idx}-${Date.now()}`,
        tag: finding.category || 'Brand Compliance',
        severity: (finding.severity || 'Medium').toLowerCase(),
        text: finding.problematic_text,
        reason: finding.explanation,
        suggestedFix: finding.suggested_rewrite,
        originalPhrase: finding.problematic_text,
        status: 'pending',
      }));

      setWarnings(formattedFindings);
      setModelUsed(data.model_used || 'Gemini');
      setCurrentReviewId(data.review_id);
      setHasScanned(true);
      showNotification(`Saved review ${data.review_id}: ${formattedFindings.length} findings detected by ${data.model_used || 'Gemini'}.`);
    } catch (err) {
      console.error('Backend Gemini check failed:', err);
      let errorMsg = err.message || 'Failed to connect to backend server.';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMsg = `Cannot connect to Preflight backend at ${BACKEND_URL}. Ensure the FastAPI server is running with 'uvicorn main:app --reload'.`;
      }
      setApiError(errorMsg);
      setHasScanned(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Image Creative File Selection & Validation
  const handleImageFileChange = (e) => {
    setImageError(null);
    setHasScannedImage(false);
    setImageFindings([]);
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(file.type) && !['.png', '.jpg', '.jpeg'].includes(ext)) {
      setImageError('Unsupported image format. Only PNG, JPG, and JPEG creative assets are supported.');
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setImageError(`Image file size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
  };

  // Image Creative Brand Compliance Inspection with Gemini
  const handleCheckImageCreative = async () => {
    if (!imageFile) {
      setImageError('Please select a creative image first.');
      return;
    }

    setIsChecking(true);
    setImageError(null);

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('purpose', purpose || 'Marketing Creative Review');
    formData.append('brand_rules', JSON.stringify(rules));

    try {
      const response = await fetch(`${BACKEND_URL}/check-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `Server returned ${response.status}: ${response.statusText}`);
      }

      setImageFindings(data.findings || []);
      setHasScannedImage(true);
      setCurrentReviewId(data.review_id);
      setModelUsed(data.model_used || 'Gemini');
      showNotification(`Creative audit complete: ${data.findings ? data.findings.length : 0} findings recorded.`);
    } catch (err) {
      console.error('Image compliance check failed:', err);
      let errorMsg = err.message || 'Failed to analyze creative image.';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMsg = `Cannot connect to Preflight backend at ${BACKEND_URL}. Ensure the server is running.`;
      }
      setImageError(errorMsg);
      setHasScannedImage(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Open and load a single review by ID
  const handleOpenReview = async (reviewId) => {
    setIsLoadingSingleReview(true);
    try {
      const response = await fetch(`${BACKEND_URL}/reviews/${reviewId}`);
      if (!response.ok) {
        throw new Error(`Failed to load review details (${response.status})`);
      }
      const data = await response.json();
      setSelectedReview(data);
    } catch (err) {
      showNotification(err.message || 'Failed to retrieve review details');
    } finally {
      setIsLoadingSingleReview(false);
    }
  };

  // Load a review back into the dashboard editor
  const handleLoadReviewIntoEditor = (rev) => {
    if (rev.content && rev.content.startsWith('[Image Creative]:')) {
      setDashboardMode('image');
      setPurpose(rev.purpose || '');
      showNotification(`Note: ${rev.id} is an image creative review.`);
    } else {
      setDashboardMode('text');
      setContent(rev.content);
      setPurpose(rev.purpose || '');
      const mapped = (rev.findings || []).map((finding, idx) => ({
        id: `rev-f-${idx}-${Date.now()}`,
        tag: finding.category || 'Brand Compliance',
        severity: (finding.severity || 'Medium').toLowerCase(),
        text: finding.problematic_text,
        reason: finding.explanation,
        suggestedFix: finding.suggested_rewrite,
        originalPhrase: finding.problematic_text,
        status: 'pending',
      }));
      setWarnings(mapped);
      setHasScanned(true);
    }
    setModelUsed(rev.model_used || 'Gemini');
    setCurrentReviewId(rev.id);
    setActiveTab('dashboard');
    showNotification(`Loaded review ${rev.id} into dashboard.`);
  };

  const handleAcceptFix = (warning) => {
    const replacement = warning.status === 'edited' && warning.editedFix ? warning.editedFix : warning.suggestedFix;
    if (warning.originalPhrase && content.includes(warning.originalPhrase)) {
      setContent((prev) => prev.replace(warning.originalPhrase, replacement));
    } else {
      setContent((prev) => prev.replace(warning.text, replacement));
    }
    setWarnings((prev) =>
      prev.map((w) => (w.id === warning.id ? { ...w, status: 'accepted' } : w))
    );
    showNotification(`Applied suggested fix for: "${warning.tag}"`);
  };

  const handleDismissWarning = (warningId) => {
    setWarnings((prev) =>
      prev.map((w) => (w.id === warningId ? { ...w, status: 'dismissed' } : w))
    );
    showNotification('Warning dismissed.');
  };

  const handleStartEdit = (warning) => {
    setEditingWarningId(warning.id);
    setCustomEditText(warning.editedFix || warning.suggestedFix);
  };

  const handleSaveEdit = (warningId) => {
    setWarnings((prev) =>
      prev.map((w) =>
        w.id === warningId
          ? { ...w, editedFix: customEditText, status: 'edited' }
          : w
      )
    );
    setEditingWarningId(null);
    showNotification('Custom fix updated.');
  };

  const handleCancelEdit = () => {
    setEditingWarningId(null);
    setCustomEditText('');
  };

  // Brand Rules Management (Manual)
  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      showNotification('Please provide a rule name.');
      return;
    }

    const createdRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      description: newRuleDescription.trim(),
      type: newRuleType,
      severity: newRuleSeverity,
      keywords: newRuleKeywords.trim() || newRuleName.trim(),
      suggestedFix: newRuleSuggestedFix.trim(),
      active: true,
      source: 'Manual'
    };

    const updatedRules = [createdRule, ...rules];
    setRules(updatedRules);

    // Reset Form
    setNewRuleName('');
    setNewRuleDescription('');
    setNewRuleType('Banned Words');
    setNewRuleSeverity('Medium');
    setNewRuleKeywords('');
    setNewRuleSuggestedFix('');

    showNotification(`Rule "${createdRule.name}" added successfully.`);
  };

  const handleDeleteRule = (ruleId) => {
    const targetRule = rules.find((r) => r.id === ruleId);
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    showNotification(`Removed rule: ${targetRule ? targetRule.name : 'Brand Rule'}`);
  };

  const handleResetDefaultRules = () => {
    setRules(DEFAULT_BRAND_RULES);
    showNotification('Restored default enterprise brand rules.');
  };

  // PDF Brand Guidelines Handling (Rule creation exclusively)
  const handleFileChange = (e) => {
    setPdfError(null);
    setPdfExtractionSuccess(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfError('Only PDF documents (.pdf) are supported. Please select a valid PDF.');
      setPdfFile(null);
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setPdfError(`File size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a smaller PDF.`);
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
  };

  const handleExtractPdfRules = async () => {
    if (!pdfFile) {
      setPdfError('Please choose a PDF file first.');
      return;
    }

    setIsExtractingPdf(true);
    setPdfError(null);
    setPdfExtractionSuccess(null);

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const response = await fetch(`${BACKEND_URL}/extract-brand-guidelines`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `Extraction failed (${response.status})`);
      }

      setProposedRules(data.proposed_rules || []);
      setPdfExtractionSuccess({
        filename: data.filename,
        count: (data.proposed_rules || []).length,
        model: data.model_used
      });
      showNotification(`Extracted ${data.proposed_rules ? data.proposed_rules.length : 0} proposed rules from ${data.filename}.`);
    } catch (err) {
      console.error('PDF extraction failed:', err);
      let msg = err.message || 'Failed to extract rules from PDF.';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        msg = `Cannot connect to Preflight backend at ${BACKEND_URL}. Ensure the server is running.`;
      }
      setPdfError(msg);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Proposed Rules Approval & Rejection (Never auto-activated)
  const handleApproveRule = (proposed) => {
    const newActiveRule = {
      id: proposed.id || `pdf-rule-${Date.now()}`,
      name: proposed.name || proposed.description.slice(0, 30) || 'PDF Guideline Rule',
      description: proposed.description,
      type: proposed.type,
      severity: proposed.severity,
      keywords: proposed.keywords || proposed.name || '',
      suggestedFix: proposed.suggestedFix || '',
      sourceExcerpt: proposed.source_excerpt,
      source: 'PDF Guidelines',
      active: true,
    };

    setRules((prev) => [newActiveRule, ...prev]);
    setProposedRules((prev) => prev.filter((r) => r.id !== proposed.id));
    showNotification(`Approved and activated rule: "${newActiveRule.name}"`);
  };

  const handleRejectRule = (proposedId) => {
    setProposedRules((prev) => prev.filter((r) => r.id !== proposedId));
    showNotification('Proposed rule rejected and dismissed.');
  };

  const handleStartEditProposed = (rule) => {
    setEditingProposedId(rule.id);
    setEditingRuleData({ ...rule });
  };

  const handleSaveProposedEdit = (ruleId) => {
    setProposedRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, ...editingRuleData } : r))
    );
    setEditingProposedId(null);
    showNotification('Updated proposed rule details.');
  };

  const handleCancelProposedEdit = () => {
    setEditingProposedId(null);
    setEditingRuleData({});
  };

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const pendingWarnings = warnings.filter((w) => w.status === 'pending' || w.status === 'edited');
  const resolvedWarnings = warnings.filter((w) => w.status === 'accepted' || w.status === 'dismissed');

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-700 animate-fade-in transition-all">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                Preflight
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 tracking-wide">
                  Gemini
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedReview(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Brand Guidelines PDF Section (exclusively for creating rules) */}
            <button
              onClick={() => {
                setActiveTab('guidelines');
                setSelectedReview(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'guidelines'
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Brand Guidelines</span>
              {proposedRules.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {proposedRules.length} proposed
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('rules');
                setSelectedReview(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'rules'
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Brand Rules</span>
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-700">
                {rules.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setSelectedReview(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Review History</span>
              {reviewsList.length > 0 && (
                <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {reviewsList.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Gemini Multimodal
              </span>
              <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Audits marketing copy and creative images against approved rules.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold capitalize">
              {activeTab === 'guidelines' 
                ? 'Brand Guidelines PDF Extraction' 
                : activeTab === 'rules' 
                ? 'Brand Rules Engine' 
                : activeTab === 'history' 
                ? 'Review History' 
                : 'Dashboard'}
            </span>
            {selectedReview && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-600 font-medium font-mono">{selectedReview.id}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">FastAPI backend at {BACKEND_URL}</span>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Global Marketing Team
            </span>
          </div>
        </header>

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && (
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Check your content before publishing.
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Scan copy or visual creatives against approved brand tone, banned words, and claims rules using Gemini.
                </p>
              </div>

              {/* Mode Toggle: Text Copy vs Visual Creative */}
              <div className="flex items-center p-1 bg-slate-200/80 rounded-lg text-xs font-semibold self-start md:self-auto">
                <button
                  onClick={() => setDashboardMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    dashboardMode === 'text'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Marketing Copy</span>
                </button>
                <button
                  onClick={() => setDashboardMode('image')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    dashboardMode === 'image'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Creative Image</span>
                </button>
              </div>
            </div>

            {/* API Setup Error Banner */}
            {(apiError || imageError) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-3.5 text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-semibold text-rose-950">Notice / Service Setup Needed</h3>
                  <p className="text-xs text-rose-700 leading-relaxed">{apiError || imageError}</p>
                </div>
              </div>
            )}

            {/* Context/Purpose Input (Common to both modes) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Content Purpose / Context
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Announce a product launch, Q3 Newsletter, Executive keynote speech"
                    className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* MODE 1: MARKETING TEXT CHECKER */}
              {dashboardMode === 'text' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Marketing Content
                      </label>
                      <span className="text-xs text-slate-400">
                        {content.trim().split(/\s+/).filter(Boolean).length} words &bull; {content.length} characters
                      </span>
                    </div>
                    <div className="relative rounded-lg border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                      <textarea
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste draft copy, messaging outlines, email drafts, or product release copy here..."
                        className="w-full text-sm text-slate-900 bg-transparent p-3.5 focus:outline-none resize-y placeholder:text-slate-400 leading-relaxed"
                      />
                      <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 rounded-b-lg">
                        <span>Evaluates against {rules.length} approved brand rules and saves to database.</span>
                        <button
                          onClick={() => {
                            setContent('');
                            showNotification('Editor cleared.');
                          }}
                          className="hover:text-slate-700 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setContent(INITIAL_CONTENT);
                        showNotification('Loaded sample enterprise marketing copy.');
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Reset with example text
                    </button>
                    <button
                      onClick={handleRunCheck}
                      disabled={isChecking || !content.trim()}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
                        isChecking || !content.trim()
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-200'
                      }`}
                    >
                      {isChecking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Checking with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Check Content</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* MODE 2: CREATIVE IMAGE CHECKER (Part 2 Requirement) */}
              {dashboardMode === 'image' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Upload Marketing Creative Asset
                      </label>
                      <span className="text-xs text-slate-400">PNG, JPG, or JPEG &bull; Max 5 MB</span>
                    </div>

                    <div 
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
                    >
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageFileChange}
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {imageFile ? imageFile.name : 'Click to select or drop a marketing creative image'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {imageFile 
                          ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for brand compliance audit`
                          : 'Checks visible text, claims, tone, and visual brand rules using Gemini'}
                      </p>
                    </div>
                  </div>

                  {/* Image Preview & Details */}
                  {imagePreviewUrl && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-5 items-center">
                      <div className="w-full md:w-56 h-36 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                        <img 
                          src={imagePreviewUrl} 
                          alt="Creative asset preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{imageFile.name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {(imageFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Will be scanned against {rules.length} approved brand rules for banned words, factual guarantees, and tone consistency.
                        </p>
                        <p className="text-[11px] text-slate-400 italic">
                          Note: Subtle color or logo checks are marked for human verification where exact proof cannot be established.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {imageFile ? (
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreviewUrl(null);
                          setHasScannedImage(false);
                          setImageFindings([]);
                          if (imageInputRef.current) imageInputRef.current.value = '';
                        }}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Clear Image
                      </button>
                    ) : <span />}

                    <button
                      onClick={handleCheckImageCreative}
                      disabled={isChecking || !imageFile}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
                        isChecking || !imageFile
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-200'
                      }`}
                    >
                      {isChecking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Auditing Creative with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Check Creative Image</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RESULTS FOR IMAGE CREATIVE AUDIT */}
            {dashboardMode === 'image' && hasScannedImage && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span>Creative Image Audit Findings</span>
                      {currentReviewId && (
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {currentReviewId} &bull; Stored in Database
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Evaluated by {modelUsed || 'Gemini'} against {rules.length} approved brand rules.
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    <strong className="text-slate-800">{imageFindings.length}</strong> {imageFindings.length === 1 ? 'finding' : 'findings'}
                  </span>
                </div>

                {imageFindings.length === 0 ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">Creative conforms to brand rules!</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      No banned copy, unverified claims, or tone violations detected in this creative asset.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {imageFindings.map((finding, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {finding.severity.toLowerCase() === 'high' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                High Severity
                              </span>
                            ) : finding.severity.toLowerCase() === 'medium' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Medium Severity
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Low Severity
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                              {finding.category}
                            </span>
                          </div>

                          {finding.requires_human_review && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <UserCheck className="w-3 h-3 text-amber-600" />
                              Requires Human Verification
                            </span>
                          )}
                        </div>

                        {/* Visual Evidence Excerpt */}
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                            Observed in Image
                          </span>
                          <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-rose-950 font-medium text-sm">
                            &ldquo;{finding.evidence}&rdquo;
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                            Compliance Policy Analysis
                          </span>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {finding.explanation}
                          </p>
                        </div>

                        {/* Suggested Correction */}
                        {finding.suggested_correction && (
                          <div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                              Recommended Creative Adjustment
                            </span>
                            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-950 text-sm">
                              {finding.suggested_correction}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RESULTS FOR TEXT CHECKER */}
            {dashboardMode === 'text' && hasScanned && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span>Compliance & Quality Findings</span>
                      {currentReviewId && (
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {currentReviewId} &bull; Saved to Database
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Evaluated by {modelUsed || 'Gemini'} against {rules.length} configured brand rules.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      <strong className="text-slate-800">{pendingWarnings.length}</strong> pending &bull;{' '}
                      <strong className="text-emerald-600">{resolvedWarnings.length}</strong> resolved
                    </span>
                  </div>
                </div>

                {warnings.length === 0 ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">All brand rules satisfied!</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Gemini verified that your copy adheres to all active brand rules, tone guidelines, and risk policies.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {warnings.map((warning) => {
                      const isResolved = warning.status === 'accepted' || warning.status === 'dismissed';
                      const isEditing = editingWarningId === warning.id;

                      return (
                        <div
                          key={warning.id}
                          className={`rounded-xl border transition-all ${
                            isResolved
                              ? 'bg-slate-50/70 border-slate-200/80 opacity-75'
                              : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300'
                          }`}
                        >
                          <div className="p-5">
                            {/* Card Top: Severity & Tag & Status */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                {warning.severity === 'high' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    High Severity
                                  </span>
                                ) : warning.severity === 'medium' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Medium Severity
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Low Severity
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                  {warning.tag}
                                </span>
                              </div>

                              {/* Status Badge */}
                              {warning.status === 'accepted' && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Accepted
                                </span>
                              )}
                              {warning.status === 'dismissed' && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                  Dismissed
                                </span>
                              )}
                              {warning.status === 'edited' && (
                                <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                                  Custom Edit
                                </span>
                              )}
                            </div>

                            {/* Problematic Text Display */}
                            <div className="mb-3">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                                Flagged Text
                              </span>
                              <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-rose-950 font-medium text-sm flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <span>&ldquo;{warning.text}&rdquo;</span>
                              </div>
                            </div>

                            {/* Reason Description */}
                            <div className="mb-4">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                                Reason & Rule Analysis
                              </span>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {warning.reason}
                              </p>
                            </div>

                            {/* Suggested Fix */}
                            <div className="mb-4">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                                Suggested Alternative
                              </span>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={customEditText}
                                    onChange={(e) => setCustomEditText(e.target.value)}
                                    rows={2}
                                    className="w-full text-sm text-slate-900 bg-white border border-blue-400 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveEdit(warning.id)}
                                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                      Save Revision
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-950 text-sm flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span>
                                      {warning.status === 'edited' && warning.editedFix
                                        ? warning.editedFix
                                        : warning.suggestedFix}
                                    </span>
                                  </div>
                                  {!isResolved && (
                                    <button
                                      onClick={() => handleStartEdit(warning)}
                                      title="Edit this suggested fix"
                                      className="text-xs text-blue-600 hover:text-blue-800 shrink-0 underline"
                                    >
                                      Edit fix
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Accept, Edit, Dismiss */}
                            {!isResolved && (
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => handleDismissWarning(warning.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Dismiss</span>
                                </button>

                                <button
                                  onClick={() => handleStartEdit(warning)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => handleAcceptFix(warning)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept Fix</span>
                                </button>
                              </div>
                            )}

                            {isResolved && (
                              <div className="flex items-center justify-end pt-1">
                                <button
                                  onClick={() => {
                                    setWarnings((prev) =>
                                      prev.map((w) =>
                                        w.id === warning.id ? { ...w, status: 'pending' } : w
                                      )
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Undo status</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        )}

        {/* Brand Guidelines PDF Section (exclusively for creating rules) */}
        {activeTab === 'guidelines' && (
          <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Brand Guidelines PDF Extraction</h1>
              <p className="text-sm text-slate-500 mt-1">
                Upload official brand guideline PDFs to automatically extract proposed compliance rules using Gemini.
                Extracted rules require manual approval before becoming active.
              </p>
            </div>

            {/* PDF Upload Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">Upload Brand Guidelines PDF</h2>
                <span className="text-[11px] font-medium text-slate-400 ml-auto">PDF only &bull; Max 5 MB</span>
              </div>

              {/* Upload Dropzone / File Picker */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {pdfFile ? pdfFile.name : 'Click to select or drop a PDF guidelines document'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {pdfFile 
                    ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for extraction` 
                    : 'Must be text-selectable PDF up to 5 MB in size'}
                </p>
              </div>

              {/* Error Banner */}
              {pdfError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-start gap-2.5 text-rose-900 text-xs">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Extraction Notice:</span>
                    <span>{pdfError}</span>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {pdfExtractionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-2.5 text-emerald-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Extraction Complete:</span>
                    <span>
                      Generated <strong>{pdfExtractionSuccess.count} proposed rules</strong> from &ldquo;{pdfExtractionSuccess.filename}&rdquo; using {pdfExtractionSuccess.model}. Review and approve below.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Content is treated as untrusted input &bull; Rules are never activated automatically</span>
                </div>

                <div className="flex items-center gap-3">
                  {pdfFile && (
                    <button
                      onClick={() => {
                        setPdfFile(null);
                        setPdfError(null);
                        setPdfExtractionSuccess(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-2 transition-colors"
                    >
                      Clear File
                    </button>
                  )}

                  <button
                    onClick={handleExtractPdfRules}
                    disabled={!pdfFile || isExtractingPdf}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                      !pdfFile || isExtractingPdf
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-200'
                    }`}
                  >
                    {isExtractingPdf ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Extracting with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract Rules</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Proposed Rules Section (Awaiting Admin Approval) */}
            {proposedRules.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">
                        Proposed Brand Rules ({proposedRules.length})
                      </h2>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Admin Approval
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review, edit, and approve each extracted rule before it becomes active in the content checker.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {proposedRules.map((rule) => {
                    const isEditing = editingProposedId === rule.id;

                    return (
                      <div key={rule.id} className="bg-white rounded-xl border border-amber-200/80 shadow-xs p-5 space-y-4">
                        {/* Header & Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {rule.severity.toLowerCase() === 'high' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                High Severity
                              </span>
                            ) : rule.severity.toLowerCase() === 'medium' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Medium Severity
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Low Severity
                              </span>
                            )}

                            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                              {rule.type}
                            </span>
                          </div>

                          <span className="text-xs font-mono text-slate-400">
                            {rule.id}
                          </span>
                        </div>

                        {/* Editable Form or Display */}
                        {isEditing ? (
                          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Rule Name</label>
                                <input
                                  type="text"
                                  value={editingRuleData.name || ''}
                                  onChange={(e) => setEditingRuleData({ ...editingRuleData, name: e.target.value })}
                                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Rule Type</label>
                                <select
                                  value={editingRuleData.type || 'Other'}
                                  onChange={(e) => setEditingRuleData({ ...editingRuleData, type: e.target.value })}
                                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                                >
                                  <option value="Banned Words">Banned Words</option>
                                  <option value="Required Words">Required Words</option>
                                  <option value="Tone">Tone</option>
                                  <option value="Factual Claim">Factual Claim</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Severity</label>
                                <select
                                  value={editingRuleData.severity || 'Medium'}
                                  onChange={(e) => setEditingRuleData({ ...editingRuleData, severity: e.target.value })}
                                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Target Keywords</label>
                                <input
                                  type="text"
                                  value={editingRuleData.keywords || ''}
                                  onChange={(e) => setEditingRuleData({ ...editingRuleData, keywords: e.target.value })}
                                  className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Description</label>
                              <textarea
                                rows={2}
                                value={editingRuleData.description || ''}
                                onChange={(e) => setEditingRuleData({ ...editingRuleData, description: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-300 rounded p-2"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={handleCancelProposedEdit}
                                className="px-3 py-1.5 rounded text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveProposedEdit(rule.id)}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">{rule.name}</h3>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.description}</p>
                            </div>

                            {/* Source Excerpt */}
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                PDF Source Excerpt:
                              </span>
                              <p className="text-xs italic text-slate-700 leading-relaxed font-serif">
                                &ldquo;{rule.source_excerpt}&rdquo;
                              </p>
                            </div>

                            {/* Target words & suggested fix */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {rule.keywords && (
                                <div>
                                  <span className="text-slate-400 font-medium">Target match:</span>{' '}
                                  <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                                    {rule.keywords}
                                  </code>
                                </div>
                              )}
                              {rule.suggestedFix && (
                                <div>
                                  <span className="text-slate-400 font-medium">Suggested fix:</span>{' '}
                                  <span className="text-blue-700 font-medium">&ldquo;{rule.suggestedFix}&rdquo;</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Approval / Rejection Controls */}
                        {!isEditing && (
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleStartEditProposed(rule)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Rule</span>
                            </button>

                            <button
                              onClick={() => handleRejectRule(rule.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() => handleApproveRule(rule)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-200"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Activate Rule</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approved Active Rules Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Approved Active Rules ({rules.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    These rules are actively evaluated whenever content is analyzed on the Dashboard.
                  </p>
                </div>
              </div>

              {rules.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                  No active rules approved yet. Extract rules from a PDF above or add rules manually in the Brand Rules tab.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200/80">
                        <tr>
                          <th className="py-3 px-4">Rule Name</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Origin</th>
                          <th className="py-3 px-4">Severity</th>
                          <th className="py-3 px-4">Details & Excerpt</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {rule.name}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                <Tag className="w-3 h-3 text-slate-400" />
                                {rule.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                rule.source === 'PDF Guidelines' 
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {rule.source || 'Manual'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {rule.severity.toLowerCase() === 'high' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  High
                                </span>
                              ) : rule.severity.toLowerCase() === 'medium' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Medium
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  Low
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs text-xs text-slate-500">
                              <div className="line-clamp-2">{rule.description}</div>
                              {rule.sourceExcerpt && (
                                <div className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                                  Excerpt: &ldquo;{rule.sourceExcerpt}&rdquo;
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                                title="Remove Rule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Working Brand Rules Page (Manual Rule Creation) */}
        {activeTab === 'rules' && (
          <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Brand Rules</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Define banned keywords, mandatory terms, tone boundaries, and claims that the Gemini checker evaluates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaultRules}
                  className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Add Rule Form Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">Add New Brand Rule (Manual)</h2>
              </div>

              <form onSubmit={handleAddRule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rule Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Rule Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. Disallow 'Guaranteed', Prohibit Competitor Slander"
                      className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Rule Type Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Rule Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value)}
                      className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="Banned Words">Banned Words</option>
                      <option value="Required Words">Required Words</option>
                      <option value="Tone">Tone</option>
                      <option value="Factual Claim">Factual Claim</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Severity Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Severity <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newRuleSeverity}
                      onChange={(e) => setNewRuleSeverity(e.target.value)}
                      className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Target Words / Phrases */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Target Words / Phrases to Match
                    </label>
                    <input
                      type="text"
                      value={newRuleKeywords}
                      onChange={(e) => setNewRuleKeywords(e.target.value)}
                      placeholder="e.g. 'cheap, foolproof' or leave blank to match rule name"
                      className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Supplied to Gemini to evaluate exact or semantic matches in copy and creatives.
                    </span>
                  </div>
                </div>

                {/* Suggested Fix */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Suggested Fix / Replacement
                  </label>
                  <input
                    type="text"
                    value={newRuleSuggestedFix}
                    onChange={(e) => setNewRuleSuggestedFix(e.target.value)}
                    placeholder="e.g. 'cost-effective' or 'reliable and verified solution'"
                    className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Rule Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Rule Description
                  </label>
                  <textarea
                    rows={2}
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                    placeholder="Provide context on why this rule exists so Gemini evaluates it accurately..."
                    className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm shadow-blue-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Rule</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Configured Rules Table / List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Active Brand Rules ({rules.length})</h2>
                  <p className="text-xs text-slate-500">
                    These rules are sent to Gemini whenever content or creatives are audited on the Dashboard.
                  </p>
                </div>
              </div>

              {rules.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No brand rules defined yet. Use the form above to add your first rule.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Rule Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Origin</th>
                        <th className="py-3 px-4">Target Keyword / Match</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Description & Suggested Fix</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {rule.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {rule.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-medium text-slate-500">
                              {rule.source || 'Manual'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {rule.keywords || rule.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {rule.severity.toLowerCase() === 'high' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                High
                              </span>
                            ) : rule.severity.toLowerCase() === 'medium' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Medium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Low
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs text-xs text-slate-500">
                            <div className="line-clamp-2">{rule.description || 'No description'}</div>
                            {rule.suggestedFix && (
                              <div className="text-[11px] text-blue-600 font-medium mt-0.5 truncate">
                                Fix: &ldquo;{rule.suggestedFix}&rdquo;
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real Review History View (Loaded from FastAPI SQLite Database) */}
        {activeTab === 'history' && (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
            {/* Header / Back navigation */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {selectedReview ? 'Review Details' : 'Review History'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedReview
                    ? `Review inspection report stored on ${formatDateTime(selectedReview.created_at)}`
                    : 'All past copy and creative checks permanently recorded in the local SQLite database.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedReview ? (
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to History</span>
                  </button>
                ) : (
                  <button
                    onClick={fetchReviewsHistory}
                    disabled={isLoadingReviews}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReviews ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error state */}
            {reviewsError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-950">Failed to load review history</p>
                  <p className="text-rose-700 mt-0.5">{reviewsError}</p>
                </div>
              </div>
            )}

            {/* Selected Review Details View */}
            {selectedReview ? (
              <div className="space-y-6">
                {/* Review Summary Bar */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                        {selectedReview.id}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {selectedReview.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateTime(selectedReview.created_at)}
                      </span>
                      {selectedReview.purpose && (
                        <span>&bull; Purpose: <strong className="text-slate-700">{selectedReview.purpose}</strong></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoadReviewIntoEditor(selectedReview)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Load into Dashboard</span>
                  </button>
                </div>

                {/* Submitted Asset */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Submitted Content / Creative
                  </h3>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedReview.content}
                  </div>
                </div>

                {/* AI Findings List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    AI-Generated Compliance Findings ({selectedReview.findings ? selectedReview.findings.length : 0})
                  </h3>

                  {(!selectedReview.findings || selectedReview.findings.length === 0) ? (
                    <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center text-xs text-emerald-800">
                      No compliance warnings were flagged for this submission.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReview.findings.map((finding, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                              {finding.category || 'Brand Compliance'}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              (finding.severity || '').toLowerCase() === 'high'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : (finding.severity || '').toLowerCase() === 'medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {finding.severity} Severity
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                              Observed Snippet / Evidence
                            </span>
                            <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-rose-950 font-medium text-sm">
                              &ldquo;{finding.problematic_text}&rdquo;
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                              Explanation
                            </span>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {finding.explanation}
                            </p>
                          </div>

                          <div>
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                              Suggested Rewrite / Correction
                            </span>
                            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-950 text-sm">
                              {finding.suggested_rewrite}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Review History List Table */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoadingReviews ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs">Loading review history from database...</p>
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-700">No reviews saved yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Whenever you submit copy or visual creatives on the Dashboard, the full report and findings are permanently stored here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200/80">
                        <tr>
                          <th className="py-3 px-4">Review ID</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Content / Creative</th>
                          <th className="py-3 px-4">Findings</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reviewsList.map((rev) => (
                          <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 text-xs">
                              {rev.id}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                              {formatDateTime(rev.created_at)}
                            </td>
                            <td className="py-3.5 px-4 max-w-md text-xs text-slate-800">
                              <div className="line-clamp-2 leading-relaxed">
                                {rev.content_preview}
                              </div>
                              {rev.purpose && (
                                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                                  Purpose: {rev.purpose}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                {rev.findings_count} {rev.findings_count === 1 ? 'finding' : 'findings'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                {rev.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleOpenReview(rev.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Clock, 
  Award, 
  Phone, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Truck,
  FileText,
  Activity
} from 'lucide-react';

interface LandingPageProps {
  onOpenGate: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenGate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [simulatedStep, setSimulatedStep] = useState<number>(3);

  const materialsCatalog = [
    {
      name: 'زيركونيا متعددة الطبقات (Multi-Layer Zirconia)',
      desc: 'صلابة تصل إلى 1200 ميجاباسكال مع تدرج لوني طبيعي يحاكي شفافية ميناء السن.',
      idealFor: 'الجسور الخلفية، التيجان المفردة عالية التحمل، وحالات صرير الأسنان.',
      badge: 'الأعلى تحملاً',
    },
    {
      name: 'إيماكس عالي الجمالية (IPS e.max CAD & Press)',
      desc: 'ليثيوم ديسيليكات فائق الشفافية يعكس الضوء بانسجام تام مع بنية السن الحقيقية.',
      idealFor: 'القواطع والأسنان الأمامية، الفينيرز، والإنلاي/الأونلاي التجميلي.',
      badge: 'الأعلى جمالية',
    },
    {
      name: 'بورسلين مدمج بالمعدن (PFM Premium)',
      desc: 'سبيكة غير معدنية نقية مغطاة بطبقات خزف دقيقة تحقق التوازن بين القوة والتكلفة.',
      idealFor: 'الجسور الطويلة والحالات الاقتصادية مع ثبات إطباقي طويل الأمد.',
      badge: 'الخيار الكلاسيكي',
    },
    {
      name: 'دعامات التيتانيوم المخصصة (Custom Titanium Abutments)',
      desc: 'خراطة رقمية مخصصة لكل غرسة مع الحفاظ التام على محيط اللثة الطبيعي وزاوية التركيب.',
      idealFor: 'كافة أنظمة زراعة الأسنان المعتمدة عالمياً.',
      badge: 'تطابق نسيجي 100%',
    },
  ];

  const workflowSteps = [
    {
      num: '01',
      title: 'الاستلام الميداني والتسجيل',
      desc: 'يستلم مندوبنا الطبعة السيليكونية أو الملف الرقمي من عيادتك مع تدوين كود الحالة وملاحظات الإطباق.',
    },
    {
      num: '02',
      title: 'المسح الضوئي وتصميم CAD',
      desc: 'فحص القالب بماسحات 3D فائقة الدقة وتصميم الهيكل ثلاثي الأبعاد على برامج CAD الاحترافية.',
    },
    {
      num: '03',
      title: 'الخراطة والتلبيد (Milling & Sintering)',
      desc: 'تفريز خماسي المحاور (5-Axis) في أجهزة ألمانية ثم المعالجة الحرارية بأفران التلبيد الرقمية.',
    },
    {
      num: '04',
      title: 'التلوين واللمعان النهائي (Glazing)',
      desc: 'لمسات فنية متخصصة للتدرج اللوني ومطابقة دليل الألوان (VITA Shade Guide) مع اللمعان النهائي.',
    },
    {
      num: '05',
      title: 'الفحص الميكروسكوبي والتسليم',
      desc: 'مراجعة حواف المارجن تحت الميكروسكوب والتوصيل للعيادة مع التايم لاين والفاتورة المعتمدة.',
    },
  ];

  const faqs = [
    {
      q: 'كيف يمكن لطبيب الأسنان متابعة مراحل تصنيع الحالة لحظة بلحظة؟',
      a: 'من خلال بوابة الأطباء في معمل Golden Lab، يمكنك الدخول بكود العيادة والـ PIN، لتجد تايم لاين مباشر يوضح أين وصلت التركيبة، من المندوب المستلم، والموعد المتبقي للتسليم بدقة.',
    },
    {
      q: 'هل يمكن للعيادة استخراج كشف حساب مالي رسمي؟',
      a: 'نعم، المنظومة تدقق كل حركة مالية بالأقراش دون أخطاء تقريب. يمكنك من شاشة الطبيب النقر على "طباعة كشف الحساب" لتحصل على مستند رسمي معتمد جاهز للمطابقة.',
    },
    {
      q: 'ما هي مدة تسليم الحالات العادية وحالات الـ Urgent؟',
      a: 'الحالات العادية تسلم خلال 3 إلى 4 أيام عمل حسب نوع الخامة. الحالات المستعجلة يمكن جدولتها بالتنسيق المباشر مع إدارة المعمل ومندوب خط سيرك.',
    },
    {
      q: 'هل يرى المندوب أي تفاصيل مالية خاصة بالأطباء الآخرين؟',
      a: 'إطلاقاً، تم بناء النظام بقواعد أمان صارمة؛ المندوب لا يرى إلا أطباء خط سيره، وكل حركة يسجلها تدخل بحالة [معلق] ولا تعتمد إلا بموافقة الإدارة العليا.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:py-24 bg-gradient-to-b from-amber-500/10 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Right Column: Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>الجيل الجديد لمعامل الأسنان الرقمية (CAD/CAM)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 font-['Cairo'] tracking-tight leading-tight">
                دقة التصنيع الرقمي، ثقة الأطباء، ومتابعة لحظية لكل مرحلة
              </h1>

              <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-medium">
                معمل <strong className="text-slate-900">Golden Lab</strong> يدمج بين حرفية فنيي الخزف وتقنيات الخراطة خماسية المحاور، مع بوابة إلكترونية تتيح لأطباء الأسنان والمندوبين تتبع مسار كل حالة (Timeline) وتدقيق الحسابات بالأقراش دون لبس.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onOpenGate}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white font-black text-sm sm:text-base shadow-xl shadow-amber-600/30 hover:shadow-amber-600/40 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Shield className="w-5 h-5 text-amber-200" />
                  <span>دخول الأطباء والمندوبين</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <a
                  href="#catalog"
                  className="px-6 py-4 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold text-sm sm:text-base hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  استعراض كتالوج الخامات
                </a>
              </div>

              {/* Guarantees stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">100%</span>
                  <span className="text-xs text-slate-500 font-medium">خامات معتمدة أوروبياً</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">±5 µm</span>
                  <span className="text-xs text-slate-500 font-medium">دقة حواف المارجن</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block">Live</span>
                  <span className="text-xs text-slate-500 font-medium">تايم لاين مباشر لكل حالة</span>
                </div>
              </div>
            </div>

            {/* Left Column: Interactive Timeline Simulation Widget */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">محاكاة حية لبوابة متابعة الحالات</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    GL-DEMO
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">تاج زيركونيا عالي الشفافية (Zirconia Crown)</span>
                    <span className="text-emerald-700 font-bold">السن: 21</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">العيادة: د. عيادات النيل للأسنان</span>
                </div>

                {/* Interactive Stepper in Hero */}
                <div className="mt-6 space-y-4">
                  {[
                    { step: 1, label: 'استلام الطبعة السيليكونية ومطابقة المارجن', done: simulatedStep >= 1 },
                    { step: 2, label: 'المسح الرقمي 3D والتصميم الافتراضي (CAD)', done: simulatedStep >= 2 },
                    { step: 3, label: 'الخراطة والتلبيد بفرن الزيركون (Sintering)', done: simulatedStep >= 3, active: simulatedStep === 3 },
                    { step: 4, label: 'التلوين واللمعان النهائي (Glazing)', done: simulatedStep >= 4 },
                    { step: 5, label: 'التسليم لعيادة الطبيب مع إيصال السداد', done: simulatedStep >= 5 },
                  ].map(s => (
                    <div 
                      key={s.step} 
                      onClick={() => setSimulatedStep(s.step)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        s.active
                          ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/20'
                          : s.done
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50/50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {s.done ? '✓' : s.step}
                      </div>
                      <span className="text-xs font-bold flex-1 text-right">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                  <button
                    onClick={onOpenGate}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                  >
                    جرّب الدخول بحساب طبيب أو مندوب الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            كتالوج التركيبات والخامات المعتمدة
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-950 font-['Cairo']">
            أعلى معايير الخامات الخزفية والتعويضات السنية
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            تخضع جميع الخامات المستعملة في Golden Lab لأعلى درجات الفحص والتحليل لضمان التوافق الحيوي والصلابة القصوى
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {materialsCatalog.map((mat, i) => (
            <div 
              key={i}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-amber-400/80 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {mat.badge}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-3 font-['Cairo'] leading-snug">
                  {mat.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {mat.desc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">الاستخدام الأمثل:</span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {mat.idealFor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Standardized Lab Workflow Infographic */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              دورة العمل القياسية
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-['Cairo']">
              مسار كل تركيبة من عيادتك وحتى التسليم
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              5 محطات دقيقة تضمن عدم حدوث أخطاء إطباقية وتسليم الحالة في موعدها المحدد
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowSteps.map(step => (
              <div 
                key={step.num}
                className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 hover:border-amber-500/50 transition-colors"
              >
                <span className="text-2xl font-black text-amber-400 font-mono block mb-2">
                  {step.num}
                </span>
                <h4 className="text-sm font-bold text-white mb-2 font-['Cairo']">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion (Schema compliant) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Cairo']">
            الأسئلة الشائعة حول المنظومة
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            إجابات واضحة لأطباء ومندوبي معمل Golden Lab
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:text-amber-800 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 shrink-0 text-amber-600" /> : <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer with Mandatory FAKE: Tag Inventory as stated in planmvp.md */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-slate-200 text-xs text-slate-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-black">
                GL
              </div>
              <span className="font-black text-base text-slate-900 font-['Cairo']">GOLDEN LAB</span>
            </div>
            <p className="leading-relaxed">
              معمل الأسنان الرقمي المتخصص في التركيبات الثابتة والمتحركة وتعويضات زراعة الأسنان.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">بيانات التواصل (موسومة للتثبيت)</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <p><span className="text-amber-600 font-bold">FAKE: </span>هاتف: +20 100 000 0000</p>
              <p><span className="text-amber-600 font-bold">FAKE: </span>واتساب: +20 100 000 0000</p>
              <p><span className="text-amber-600 font-bold">FAKE: </span>بريد: info@goldenlab-dental.com</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">المقر الرئيسي</h4>
            <div className="space-y-1.5 text-[11px]">
              <p><span className="text-amber-600 font-bold">FAKE: </span>القاهرة، جمهورية مصر العربية</p>
              <p><span className="text-amber-600 font-bold">FAKE: </span>برج الأطباء التخصصي - الدور الرابع</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">الأمان والحوكمة</h4>
            <p className="text-[11px] leading-relaxed">
              تخضع جميع المعاملات المالية وقيد الحالات لقواعد تدقيق صارمة وسجل تدقيق أمني غير قابل للتعديل (Audit Trail).
            </p>
          </div>
        </div>

        <div className="py-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <p>© 2026 Golden Lab Dental Laboratory. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <a href="/public/llms.txt" className="text-slate-400 hover:text-slate-600">llms.txt</a>
            <span>•</span>
            <span className="text-slate-400">نسخة العرض الأولية (Golden Lab MVP)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

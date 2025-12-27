import { ShieldCheck, Clock, PackageCheck } from 'lucide-react';

const OurSpecs = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
      title: 'Thanh toán an toàn',
      description: 'Thanh toán được bảo mật an toàn với đối tác của chúng tôi.',
    },
    {
      icon: <PackageCheck className="w-8 h-8 text-green-600" />,
      title: 'Đảm bảo chất lượng',
      description: 'Cam kết chất lượng sản phẩm. Đảm bảo hài lòng.',
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ hỗ trợ luôn sẵn sàng phục vụ bạn.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start p-6 bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="mr-5 flex-shrink-0">{feature.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurSpecs;

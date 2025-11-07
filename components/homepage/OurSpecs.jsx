import { ShieldCheck, Truck, Clock, PackageCheck } from 'lucide-react';

const OurSpecs = () => {
  const features = [
    {
      icon: <Truck className="w-8 h-8 text-green-600" />,
      title: 'Free Shipping',
      description: 'Enjoy free shipping on all orders.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
      title: 'Secure Payments',
      description: 'Your payments are processed securely with our partners.',
    },
    {
      icon: <PackageCheck className="w-8 h-8 text-green-600" />,
      title: 'Quality Guarantee',
      description: 'We stand by the quality of our products. Satisfaction guaranteed.',
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: '24/7 Support',
      description: 'Our support team is available around the clock to assist you.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

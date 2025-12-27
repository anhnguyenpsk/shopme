'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setLoading(true);
    try {
      // This is a mock API call. In a real app, you would have an endpoint.
      await new Promise(resolve => setTimeout(resolve, 1000));

      // const response = await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to subscribe.');
      // }

      toast.success('Cảm ơn bạn đã đăng ký nhận bản tin!');
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-800 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-700 text-slate-200 text-sm font-medium">
              <Mail className="w-4 h-4 mr-2" />
              Cập nhật tin tức
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Đăng ký nhận bản tin
            </h2>

            <p className="text-lg text-slate-300 max-w-lg">
              Nhận thông tin mới nhất về sản phẩm, ưu đãi đặc biệt và khuyến mãi độc quyền gửi thẳng vào hộp thư của bạn.
            </p>
          </div>

          {/* Right Content - Subscription Form */}
          <div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 h-12 bg-slate-700 border-slate-600 text-white focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 h-12" disabled={loading}>
                <Send className="w-5 h-5 mr-2" />
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </Button>
            </form>
            <p className="text-xs text-slate-400 mt-3">
              Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;

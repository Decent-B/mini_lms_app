const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/lotus.webp"
                alt="Mini LMS Logo"
                className="w-12 h-12"
              />
              <h3 className="text-xl font-bold">Mini LMS</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your trusted partner in educational excellence. We provide comprehensive learning management solutions 
              for students, parents, and educators to track progress and manage classes effectively.
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-left">Contact Us</h3>
            <div className="space-y-3 text-slate-300 text-sm text-left">
              <div className="flex items-start gap-3 text-left">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium text-white text-left">Head Office</p>
                  <p className="text-left">123 Education Boulevard</p>
                  <p className="text-left">Knowledge District, ED 12345</p>
                  <p className="text-left">United States</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium text-white text-left">Phone</p>
                  <p className="text-left">+1 (555) 123-4567</p>
                  <p className="text-xs text-slate-400 text-left">Mon-Fri: 8:00 AM - 6:00 PM EST</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium text-white text-left">Email</p>
                  <a href="mailto:info@minilms.edu" className="hover:text-blue-400 transition text-left block">
                    info@minilms.edu
                  </a>
                  <p className="text-xs text-slate-400 text-left">We reply within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2 text-slate-300 text-sm">
              <a href="#" className="block hover:text-blue-400 transition">About Us</a>
              <a href="#" className="block hover:text-blue-400 transition">Programs & Courses</a>
              <a href="#" className="block hover:text-blue-400 transition">Support Center</a>
              <a href="#" className="block hover:text-blue-400 transition">Privacy Policy</a>
              <a href="#" className="block hover:text-blue-400 transition">Terms of Service</a>
              <a href="#" className="block hover:text-blue-400 transition">Student Resources</a>
            </div>
            
            {/* Social Media */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Follow Us</p>
              <div className="flex gap-3 justify-center">
                <a href="#" className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-400 transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Mini LMS. All rights reserved.</p>
          <p className="mt-2">Empowering education through innovative learning management solutions.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

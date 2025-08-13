// IP Address Analyzer JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const ipInput = document.getElementById('ipInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsContainer = document.getElementById('results');
    const exampleBtns = document.querySelectorAll('.example-btn');

    // Add event listeners
    analyzeBtn.addEventListener('click', analyzeIP);
    ipInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeIP();
        }
    });

    // Add event listeners for example buttons
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const ip = this.getAttribute('data-ip');
            ipInput.value = ip;
            analyzeIP();
        });
    });

    function analyzeIP() {
        const ipAddress = ipInput.value.trim();
        
        if (!ipAddress) {
            showError('Please enter an IP address');
            return;
        }

        const result = validateAndAnalyzeIP(ipAddress);
        displayResults(result);
    }

    function validateAndAnalyzeIP(ip) {
        // Split the IP address by dots
        const octets = ip.split('.');
        
        // Check if there are exactly 4 octets
        if (octets.length !== 4) {
            return {
                valid: false,
                reason: `An IPv4 address must consist of exactly four octets (numbers separated by dots). This address has ${octets.length} octets.`
            };
        }

        // Validate each octet
        for (let i = 0; i < octets.length; i++) {
            const octet = octets[i];
            
            // Check for empty octet
            if (octet === '') {
                return {
                    valid: false,
                    reason: `Octet ${i + 1} is empty. Each octet must contain a number.`
                };
            }

            // Check for leading zeros (except for '0' itself)
            if (octet.length > 1 && octet[0] === '0') {
                return {
                    valid: false,
                    reason: `Octet ${i + 1} (${octet}) has a leading zero. Leading zeros are not allowed in standard dotted-decimal notation as they can be interpreted as octal numbers.`
                };
            }

            // Check if it's a valid number
            if (!/^\d+$/.test(octet)) {
                return {
                    valid: false,
                    reason: `Octet ${i + 1} (${octet}) is not a valid decimal number. Each octet must contain only digits 0-9.`
                };
            }

            // Check if the number is within valid range (0-255)
            const num = parseInt(octet, 10);
            if (num < 0 || num > 255) {
                return {
                    valid: false,
                    reason: `Octet ${i + 1} (${octet}) is out of range. Each octet must be between 0 and 255, inclusive.`
                };
            }

            // Check for excessively long octets (more than 3 digits)
            if (octet.length > 3) {
                return {
                    valid: false,
                    reason: `Octet ${i + 1} (${octet}) is too long. Each octet should not exceed 3 digits.`
                };
            }
        }

        // If we reach here, the IP is valid
        const firstOctet = parseInt(octets[0], 10);
        const ipClass = determineIPClass(firstOctet);
        const { networkId, hostId } = extractNetworkAndHostId(octets, ipClass);

        return {
            valid: true,
            ip: ip,
            class: ipClass,
            networkId: networkId,
            hostId: hostId,
            firstOctet: firstOctet
        };
    }

    function determineIPClass(firstOctet) {
        if (firstOctet >= 1 && firstOctet <= 126) {
            return 'A';
        } else if (firstOctet >= 128 && firstOctet <= 191) {
            return 'B';
        } else if (firstOctet >= 192 && firstOctet <= 223) {
            return 'C';
        } else if (firstOctet >= 224 && firstOctet <= 239) {
            return 'D';
        } else if (firstOctet >= 240 && firstOctet <= 255) {
            return 'E';
        } else {
            return 'Unknown';
        }
    }

    function extractNetworkAndHostId(octets, ipClass) {
        let networkId, hostId;

        switch (ipClass) {
            case 'A':
                networkId = `${octets[0]}.0.0.0`;
                hostId = `${octets[1]}.${octets[2]}.${octets[3]}`;
                break;
            case 'B':
                networkId = `${octets[0]}.${octets[1]}.0.0`;
                hostId = `${octets[2]}.${octets[3]}`;
                break;
            case 'C':
                networkId = `${octets[0]}.${octets[1]}.${octets[2]}.0`;
                hostId = octets[3];
                break;
            case 'D':
            case 'E':
                networkId = 'N/A (Multicast/Experimental)';
                hostId = 'N/A (Multicast/Experimental)';
                break;
            default:
                networkId = 'Unknown';
                hostId = 'Unknown';
        }

        return { networkId, hostId };
    }

    function displayResults(result) {
        if (result.valid) {
            displayValidResult(result);
        } else {
            displayInvalidResult(result);
        }
    }

    function displayValidResult(result) {
        const classInfo = getClassInfo(result.class);
        
        resultsContainer.innerHTML = `
            <div class="result-valid">
                <h3>✅ Valid IPv4 Address</h3>
                <div class="result-item">
                    <h4>IP Address</h4>
                    <p><code>${result.ip}</code></p>
                </div>
                <div class="result-item">
                    <h4>Class</h4>
                    <p><strong>Class ${result.class}</strong></p>
                    <p>${classInfo.description}</p>
                    <p><strong>Range:</strong> ${classInfo.range}</p>
                    <p><strong>Default Subnet Mask:</strong> ${classInfo.subnetMask}</p>
                </div>
                <div class="result-item">
                    <h4>Network ID</h4>
                    <p><code>${result.networkId}</code></p>
                    <p>This identifies the specific network to which the device is connected.</p>
                </div>
                <div class="result-item">
                    <h4>Host ID</h4>
                    <p><code>${result.hostId}</code></p>
                    <p>This identifies the specific device within the network.</p>
                </div>
                ${result.class === 'A' || result.class === 'B' || result.class === 'C' ? `
                <div class="result-item">
                    <h4>Network Capacity</h4>
                    <p><strong>Network Bits:</strong> ${classInfo.networkBits}</p>
                    <p><strong>Host Bits:</strong> ${classInfo.hostBits}</p>
                    <p><strong>Maximum Hosts per Network:</strong> ${classInfo.maxHosts}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    function displayInvalidResult(result) {
        resultsContainer.innerHTML = `
            <div class="result-invalid">
                <h3>❌ Invalid IPv4 Address</h3>
                <div class="result-item">
                    <h4>Reason</h4>
                    <p>${result.reason}</p>
                </div>
                <div class="result-item">
                    <h4>Valid IPv4 Format</h4>
                    <p>A valid IPv4 address must:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>Consist of exactly four octets separated by dots</li>
                        <li>Each octet must be a number between 0 and 255</li>
                        <li>No leading zeros (except for the number 0 itself)</li>
                        <li>Only contain digits 0-9</li>
                    </ul>
                    <p style="margin-top: 15px;"><strong>Example:</strong> <code>192.168.1.1</code></p>
                </div>
            </div>
        `;
    }

    function getClassInfo(ipClass) {
        const classData = {
            'A': {
                description: 'Used for large networks with many hosts',
                range: '1.0.0.0 to 126.255.255.255',
                subnetMask: '255.0.0.0',
                networkBits: 8,
                hostBits: 24,
                maxHosts: '16,777,214 (2²⁴ - 2)'
            },
            'B': {
                description: 'Used for medium-sized networks',
                range: '128.0.0.0 to 191.255.255.255',
                subnetMask: '255.255.0.0',
                networkBits: 16,
                hostBits: 16,
                maxHosts: '65,534 (2¹⁶ - 2)'
            },
            'C': {
                description: 'Used for small networks',
                range: '192.0.0.0 to 223.255.255.255',
                subnetMask: '255.255.255.0',
                networkBits: 24,
                hostBits: 8,
                maxHosts: '254 (2⁸ - 2)'
            },
            'D': {
                description: 'Reserved for multicast addresses',
                range: '224.0.0.0 to 239.255.255.255',
                subnetMask: 'N/A',
                networkBits: 'N/A',
                hostBits: 'N/A',
                maxHosts: 'N/A'
            },
            'E': {
                description: 'Reserved for experimental use',
                range: '240.0.0.0 to 255.255.255.255',
                subnetMask: 'N/A',
                networkBits: 'N/A',
                hostBits: 'N/A',
                maxHosts: 'N/A'
            }
        };

        return classData[ipClass] || {
            description: 'Unknown class',
            range: 'Unknown',
            subnetMask: 'Unknown',
            networkBits: 'Unknown',
            hostBits: 'Unknown',
            maxHosts: 'Unknown'
        };
    }

    function showError(message) {
        resultsContainer.innerHTML = `
            <div class="result-invalid">
                <h3>⚠️ Error</h3>
                <div class="result-item">
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active state to navigation based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('nav a');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Add some visual feedback for the input field
    ipInput.addEventListener('input', function() {
        this.style.borderColor = '';
        this.style.boxShadow = '';
    });

    // Add loading state for analyze button
    function setLoadingState(loading) {
        if (loading) {
            analyzeBtn.textContent = 'Analyzing...';
            analyzeBtn.disabled = true;
        } else {
            analyzeBtn.textContent = 'Analyze IP';
            analyzeBtn.disabled = false;
        }
    }

    // Enhanced analyze function with loading state
    const originalAnalyzeIP = analyzeIP;
    analyzeIP = function() {
        setLoadingState(true);
        
        // Add a small delay to show the loading state
        setTimeout(() => {
            originalAnalyzeIP();
            setLoadingState(false);
        }, 300);
    };
});


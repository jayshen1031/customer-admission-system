// 主页面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化
    initRatingOptions();
    initForm();
    initCompanyAutocomplete();
    
    // 初始化企业名称显示
    updateCurrentCompanyName();
});

// 企业名称自动补全
let autocompleteTimeout;
let currentSuggestionIndex = -1;
let autocompleteVisible = false;

function initCompanyAutocomplete() {
    const customerNameInput = document.getElementById('customerName');
    const autocompleteContainer = document.getElementById('companyAutocomplete');
    
    if (!customerNameInput || !autocompleteContainer) return;
    
    // 输入事件
    customerNameInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        // 清除之前的超时
        if (autocompleteTimeout) {
            clearTimeout(autocompleteTimeout);
        }
        
        // 延迟搜索，避免频繁请求
        autocompleteTimeout = setTimeout(() => {
            if (query.length >= 2) {
                searchCompanies(query);
            } else if (query.length === 0) {
                showPopularCompanies();
            } else {
                hideAutocomplete();
            }
        }, 300);
    });
    
    // 焦点事件
    customerNameInput.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            searchCompanies(query);
        } else if (query.length === 0) {
            showPopularCompanies();
        }
    });
    
    // 失去焦点事件
    customerNameInput.addEventListener('blur', function() {
        // 延迟隐藏，确保点击建议项有效
        setTimeout(() => {
            hideAutocomplete();
        }, 200);
    });
    
    // 键盘导航
    customerNameInput.addEventListener('keydown', function(e) {
        if (!autocompleteVisible) return;
        
        const suggestions = autocompleteContainer.querySelectorAll('.autocomplete-suggestion');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
                updateSuggestionSelection(suggestions);
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
                updateSuggestionSelection(suggestions);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentSuggestionIndex >= 0 && suggestions[currentSuggestionIndex]) {
                    selectSuggestion(suggestions[currentSuggestionIndex]);
                }
                break;
            case 'Escape':
                hideAutocomplete();
                break;
        }
    });
    
    // 点击外部区域隐藏建议
    document.addEventListener('click', function(e) {
        if (!customerNameInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            hideAutocomplete();
        }
    });
}

async function searchCompanies(query) {
    try {
        showAutocompleteLoading();
        
        const response = await fetch(`/api/company-autocomplete?q=${encodeURIComponent(query)}&limit=8`);
        const result = await response.json();
        
        if (result.success && result.data.suggestions.length > 0) {
            showSuggestions(result.data.suggestions, query);
        } else {
            showNoResults(query);
        }
    } catch (error) {
        console.error('搜索企业名称失败:', error);
        showAutocompleteError();
    }
}

async function showPopularCompanies() {
    try {
        const response = await fetch('/api/company-autocomplete?limit=8');
        const result = await response.json();
        
        if (result.success && result.data.suggestions.length > 0) {
            showSuggestions(result.data.suggestions, '', true);
        }
    } catch (error) {
        console.error('获取热门企业失败:', error);
    }
}

function showSuggestions(suggestions, query, isPopular = false) {
    const autocompleteContainer = document.getElementById('companyAutocomplete');
    
    let html = '';
    
    if (isPopular) {
        html += '<div class="autocomplete-hint"><i class="bi bi-star me-1"></i> 热门企业推荐</div>';
    }
    
    suggestions.forEach((suggestion, index) => {
        const matchTypeText = getMatchTypeText(suggestion.type);
        const matchTypeClass = suggestion.type;
        
        html += `
            <div class="autocomplete-suggestion" data-index="${index}" data-company="${suggestion.name}">
                <span class="company-name">${highlightMatch(suggestion.name, query)}</span>
                <span class="match-type ${matchTypeClass}">${matchTypeText}</span>
            </div>
        `;
    });
    
    autocompleteContainer.innerHTML = html;
    autocompleteContainer.style.display = 'block';
    autocompleteVisible = true;
    currentSuggestionIndex = -1;
    
    // 绑定点击事件
    autocompleteContainer.querySelectorAll('.autocomplete-suggestion').forEach(item => {
        item.addEventListener('click', function() {
            selectSuggestion(this);
        });
    });
}

function showAutocompleteLoading() {
    const autocompleteContainer = document.getElementById('companyAutocomplete');
    autocompleteContainer.innerHTML = `
        <div class="autocomplete-loading">
            <i class="bi bi-search me-2"></i>正在搜索...
        </div>
    `;
    autocompleteContainer.style.display = 'block';
    autocompleteVisible = true;
}

function showNoResults(query) {
    const autocompleteContainer = document.getElementById('companyAutocomplete');
    autocompleteContainer.innerHTML = `
        <div class="autocomplete-empty">
            <i class="bi bi-exclamation-circle me-2"></i>未找到包含 "${query}" 的企业
            <div class="intelligent-search-section mt-2">
                <button type="button" class="btn btn-outline-primary btn-sm" onclick="showIntelligentSearch('${query}')">
                    <i class="bi bi-magic me-1"></i>智能搜索相似企业
                </button>
            </div>
        </div>
    `;
    autocompleteContainer.style.display = 'block';
    autocompleteVisible = true;
}

function showAutocompleteError() {
    const autocompleteContainer = document.getElementById('companyAutocomplete');
    autocompleteContainer.innerHTML = `
        <div class="autocomplete-empty">
            <i class="bi bi-exclamation-triangle me-2"></i>搜索失败，请重试
        </div>
    `;
    autocompleteContainer.style.display = 'block';
    autocompleteVisible = true;
}

function hideAutocomplete() {
    const autocompleteContainer = document.getElementById('companyAutocomplete');
    autocompleteContainer.style.display = 'none';
    autocompleteVisible = false;
    currentSuggestionIndex = -1;
}

function updateSuggestionSelection(suggestions) {
    suggestions.forEach((item, index) => {
        if (index === currentSuggestionIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function selectSuggestion(suggestionElement) {
    const companyName = suggestionElement.getAttribute('data-company');
    const customerNameInput = document.getElementById('customerName');
    
    customerNameInput.value = companyName;
    hideAutocomplete();
    
    // 触发输入事件，以便其他组件知道值已改变
    customerNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 添加到自定义数据库（如果不存在）
    addCompanyToDatabase(companyName);
}

function highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function getMatchTypeText(type) {
    const types = {
        'exact': '精确',
        'pinyin': '拼音',
        'keyword': '关键词',
        'fuzzy': '模糊',
        'popular': '热门'
    };
    return types[type] || type;
}

async function addCompanyToDatabase(companyName) {
    try {
        await fetch('/api/company-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ company_name: companyName })
        });
    } catch (error) {
        // 静默处理错误，不影响用户体验
        console.log('添加企业到数据库失败:', error);
    }
}

// 初始化评分选项点击事件
function initRatingOptions() {
    const ratingOptions = document.querySelectorAll('.rating-option');
    
    ratingOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                // 清除同组其他选项的选中状态
                const groupName = radioInput.name;
                const sameGroupOptions = document.querySelectorAll(`input[name="${groupName}"]`);
                sameGroupOptions.forEach(input => {
                    input.closest('.rating-option').classList.remove('selected');
                });
                
                // 选中当前选项
                radioInput.checked = true;
                this.classList.add('selected');
            }
        });
    });
}

// 更新资信评分表中显示的企业名称
function updateCurrentCompanyName() {
    const customerNameInput = document.getElementById('customerName');
    const currentCompanyNameSpan = document.getElementById('currentCompanyName');
    
    if (customerNameInput && currentCompanyNameSpan) {
        const companyName = customerNameInput.value.trim();
        if (companyName) {
            currentCompanyNameSpan.textContent = companyName;
        } else {
            currentCompanyNameSpan.textContent = '请先在主页面输入客户名称';
        }
    }
}

// 初始化表单事件
function initForm() {
    const form = document.getElementById('ratingForm');
    const customerNameInput = document.getElementById('customerName');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateRating();
    });
    
    form.addEventListener('reset', function() {
        setTimeout(() => {
            // 清除所有选中状态
            document.querySelectorAll('.rating-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // 隐藏结果，显示空状态
            showEmptyResult();
            
            // 更新企业名称显示
            updateCurrentCompanyName();
        }, 100);
    });
    
    // 监听客户名称输入框变化
    if (customerNameInput) {
        customerNameInput.addEventListener('input', updateCurrentCompanyName);
    }
    
    // 监听资信评分模态框打开事件
    const creditRatingModal = document.getElementById('creditRatingModal');
    if (creditRatingModal) {
        creditRatingModal.addEventListener('show.bs.modal', function() {
            updateCurrentCompanyName();
        });
    }
}

// 计算评级
async function calculateRating() {
    try {
        // 验证表单
        if (!validateForm()) {
            return;
        }
        
        // 收集表单数据
        const formData = collectFormData();
        
        // 显示加载状态
        showLoading();
        
        // 发送请求
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示结果
            showResult(result.data);
        } else {
            throw new Error(result.error || '计算评级失败');
        }
        
    } catch (error) {
        console.error('计算评级出错:', error);
        alert('计算评级时发生错误：' + error.message);
        showEmptyResult();
    }
}

// 验证表单
function validateForm() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerType = document.getElementById('customerType').value;
    
    if (!customerName) {
        alert('请输入客户名称');
        document.getElementById('customerName').focus();
        return false;
    }
    
    if (!customerType) {
        alert('请选择客户类型');
        document.getElementById('customerType').focus();
        return false;
    }
    
    // 检查所有必填的评分项
    const requiredFields = ['industry', 'businessType', 'influence', 'logisticsScale', 'profitEstimate'];
    
    for (const field of requiredFields) {
        const selectedInput = document.querySelector(`input[name="${field}"]:checked`);
        if (!selectedInput) {
            alert(`请选择${getFieldDisplayName(field)}`);
            return false;
        }
    }
    
    // 验证资信评分
    if (!validateCreditScore()) {
        return false;
    }
    
    return true;
}

// 获取字段显示名称
function getFieldDisplayName(field) {
    const names = {
        'industry': '行业类型',
        'businessType': '业务类型',
        'influence': '客户影响力',
        'logisticsScale': '物流费规模',
        'creditScore': '资信评分',
        'profitEstimate': '商机预估'
    };
    return names[field] || field;
}

// 收集表单数据
function collectFormData() {
    const getSelectedValue = (name) => {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        return selected ? parseInt(selected.value) : 0;
    };
    
    const getSelectedText = (name) => {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        if (!selected) return '';
        
        const formCheck = selected.closest('.form-check');
        if (!formCheck) return '';
        
        const label = formCheck.querySelector('label');
        return label ? label.textContent.trim() : '';
    };
    
    const customerType = document.getElementById('customerType');
    
    return {
        customer_name: document.getElementById('customerName').value.trim(),
        customer_type: customerType.value,
        customer_type_text: customerType.options[customerType.selectedIndex].text,
        industry_score: getSelectedValue('industry'),
        industry_detail: getSelectedText('industry'),
        business_type_score: getSelectedValue('businessType'),
        business_type_detail: getSelectedText('businessType'),
        influence_score: getSelectedValue('influence'),
        influence_detail: getSelectedText('influence'),
        logistics_scale_score: getSelectedValue('logisticsScale'),
        logistics_scale_detail: getSelectedText('logisticsScale'),
        credit_score: parseInt(creditScoreValue) || 0,
        credit_detail: creditRatingText,
        profit_estimate_score: getSelectedValue('profitEstimate'),
        profit_estimate_detail: getSelectedText('profitEstimate')
    };
}

// 显示加载状态
function showLoading() {
    const resultSection = document.getElementById('resultSection');
    const emptyResult = document.getElementById('emptyResult');
    
    resultSection.classList.add('d-none');
    emptyResult.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">计算中...</span>
            </div>
            <p class="mt-3 text-muted">正在计算评级...</p>
        </div>
    `;
    emptyResult.classList.remove('d-none');
}

// 显示结果
function showResult(data) {
    // 更新结果显示
    document.getElementById('resultCustomerName').textContent = data.customer_name;
    document.getElementById('resultCustomerType').textContent = data.customer_type_text || getCustomerTypeText(data.customer_type);
    document.getElementById('totalScore').textContent = data.total_score;
    
    // 设置等级徽章
    const gradeElement = document.getElementById('resultGrade');
    gradeElement.textContent = data.grade;
    gradeElement.className = 'level-badge ' + getGradeClass(data.grade);
    
    // 设置消息
    const messageElement = document.getElementById('resultMessage');
    const messageTextElement = document.getElementById('resultMessageText');
    messageTextElement.textContent = data.message;
    messageElement.className = 'alert alert-' + data.alert_class;
    
    // 显示结果区域
    document.getElementById('emptyResult').classList.add('d-none');
    document.getElementById('resultSection').classList.remove('d-none');
}

// 显示空状态
function showEmptyResult() {
    document.getElementById('resultSection').classList.add('d-none');
    document.getElementById('emptyResult').innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center py-5">
            <i class="bi bi-clipboard-data display-1 text-muted mb-3"></i>
            <h5 class="text-muted">请填写评分表单</h5>
            <p class="text-muted">完成所有必填项后点击"计算评级"按钮</p>
        </div>
    `;
    document.getElementById('emptyResult').classList.remove('d-none');
}

// 获取客户类型文本
function getCustomerTypeText(type) {
    const types = {
        'direct': '直接客户',
        'global': 'Global同行客户',
        'overseas': '海外代理客户',
        'peer': '同行客户'
    };
    return types[type] || type;
}

// 获取等级样式类
function getGradeClass(grade) {
    switch(grade) {
        case 'A+': return 'a-plus-bg';
        case 'A': return 'a-bg';
        case 'B': return 'b-bg';
        case 'C': return 'c-bg';
        case 'D': return 'd-bg';
        default: return 'd-bg';
    }
}

// 全局变量存储资信评分值
let creditScoreValue = '';
let creditRatingText = "请填写资信评分表";

// 资信评分表相关功能
document.addEventListener('DOMContentLoaded', function() {
    // 为资信评分表单添加变更事件
    const creditForm = document.getElementById('creditRatingForm');
    if (creditForm) {
        creditForm.addEventListener('change', calculateCreditScore);
    }

    // 自动获取企业信息按钮事件
    const autoFillBtn = document.getElementById('autoFillBtn');
    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', autoFillCompanyInfo);
    }

    // 保存资信评分按钮事件
    const saveCreditBtn = document.getElementById('saveCreditRating');
    if (saveCreditBtn) {
        saveCreditBtn.addEventListener('click', function() {
            // 计算并保存资信评分
            calculateCreditScore();
            
            // 更新主表单资信评分
            const creditScoreElement = document.getElementById('creditScore');
            const creditRatingElement = document.getElementById('creditRating');
            const creditDisplayElement = document.getElementById('creditRatingDisplay');
            const creditScoreDisplayElement = document.getElementById('creditScoreDisplay');
            
            if (creditScoreElement && creditRatingElement && creditDisplayElement && creditScoreDisplayElement) {
                creditScoreElement.value = creditScoreValue;
                creditRatingElement.value = creditRatingText;
                creditDisplayElement.textContent = creditRatingText;
                creditScoreDisplayElement.textContent = creditScoreValue;
            }
            
            // 关闭模态框
            const modalElement = document.getElementById('creditRatingModal');
            let modal = bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
                modal = new bootstrap.Modal(modalElement);
            }
            modal.hide();
        });
    }
    
    // 清空资信评分按钮事件（如果需要）
    const resetCreditBtn = document.querySelector('button[type="reset"]');
    if (resetCreditBtn) {
        resetCreditBtn.addEventListener('click', function() {
            // 清除资信评分
            document.getElementById('creditRatingDisplay').textContent = "请填写资信评分表";
            document.getElementById('creditScoreDisplay').textContent = "0";
            creditScoreValue = '';
            creditRatingText = "请填写资信评分表";
        });
    }
});

// 计算资信评分函数
function calculateCreditScore() {
    const form = document.getElementById('creditRatingForm');
    const formData = new FormData(form);
    
    let totalScore = 0;
    let scoreBreakdown = [];
    
    // 计算各项得分
    for (let [name, value] of formData.entries()) {
        if (value && !isNaN(value)) {
            const score = parseFloat(value);
            totalScore += score;
            
            // 获取选项文本
            const select = form.querySelector(`select[name="${name}"]`);
            const selectedOption = select.options[select.selectedIndex];
            scoreBreakdown.push(`${selectedOption.textContent}`);
        }
    }
    
    // 更新总分显示
    document.getElementById('creditTotalScore').textContent = totalScore.toFixed(0);
    
    // 确定信用等级
    let creditLevel = '';
    let finalScore = 0;
    
    if (totalScore >= 90) {
        creditLevel = '优秀';
        finalScore = 25;
    } else if (totalScore >= 80) {
        creditLevel = '良好';
        finalScore = 20;
    } else if (totalScore >= 65) {
        creditLevel = '一般';
        finalScore = 15;
    } else {
        creditLevel = '较差';
        finalScore = 5;
    }
    
    document.getElementById('creditLevel').textContent = creditLevel;
    
    // 更新全局变量
    creditScoreValue = finalScore.toString();
    creditRatingText = `${creditLevel}（${totalScore.toFixed(0)}分）`;
}

// 验证资信评分是否已填写
function validateCreditScore() {
    if (!creditScoreValue || creditScoreValue === '') {
        alert('请先填写客户资信评分表！');
        return false;
    }
    return true;
}

// 自动获取企业信息功能
async function autoFillCompanyInfo() {
    // 从主页面的客户名称输入框获取企业名称
    const mainCompanyNameInput = document.getElementById('customerName');
    const companyName = mainCompanyNameInput.value.trim();
    
    if (!companyName) {
        alert('请先在主页面输入客户名称');
        // 关闭资信评分模态框，让用户回到主页面输入
        const modalElement = document.getElementById('creditRatingModal');
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        mainCompanyNameInput.focus();
        return;
    }
    
    // 显示加载状态
    showAutoFillLoading(true);
    hideAutoFillMessages();
    
    try {
        const response = await fetch('/api/external-company-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ company_name: companyName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 成功获取数据，自动填充表单
            fillCreditRatingForm(data.credit_mapping, data.company_info);
            showAutoFillSuccess(`成功获取 ${data.company_info.company_name} 的企业信息`);
            
            // 自动计算评分
            calculateCreditScore();
            
        } else {
            // 处理错误
            showAutoFillError(data.error || '获取企业信息失败');
        }
        
    } catch (error) {
        console.error('获取企业信息失败:', error);
        showAutoFillError('网络连接失败，请检查网络后重试');
    } finally {
        showAutoFillLoading(false);
    }
}

// 填充资信评分表单
function fillCreditRatingForm(creditMapping, companyInfo) {
    const form = document.getElementById('creditRatingForm');
    
    // 填充各个选项
    Object.keys(creditMapping).forEach(fieldName => {
        const value = creditMapping[fieldName];
        const select = form.querySelector(`select[name="${fieldName}"]`);
        if (select) {
            select.value = value;
        }
    });
    
    // 可以在这里添加企业基本信息的显示
    console.log('企业基本信息:', companyInfo);
}

// 显示/隐藏加载状态
function showAutoFillLoading(show) {
    const loadingElement = document.getElementById('autoFillLoading');
    const button = document.getElementById('autoFillBtn');
    
    if (show) {
        loadingElement.classList.remove('d-none');
        button.disabled = true;
        button.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>获取中...';
    } else {
        loadingElement.classList.add('d-none');
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-download me-2"></i>自动获取';
    }
}

// 显示成功消息
function showAutoFillSuccess(message) {
    const resultElement = document.getElementById('autoFillResult');
    const messageElement = document.getElementById('autoFillMessage');
    
    messageElement.textContent = message;
    resultElement.classList.remove('d-none');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        resultElement.classList.add('d-none');
    }, 3000);
}

// 显示错误消息
function showAutoFillError(message) {
    const errorElement = document.getElementById('autoFillError');
    const messageElement = document.getElementById('autoFillErrorMessage');
    
    messageElement.textContent = message;
    errorElement.classList.remove('d-none');
    
    // 5秒后自动隐藏
    setTimeout(() => {
        errorElement.classList.add('d-none');
    }, 5000);
}

// 隐藏所有自动填充消息
function hideAutoFillMessages() {
    document.getElementById('autoFillResult').classList.add('d-none');
    document.getElementById('autoFillError').classList.add('d-none');
}

// ===== 智能搜索功能 =====

let currentSearchQuery = '';
let currentSearchPage = 1;

async function showIntelligentSearch(query) {
    try {
        // 隐藏自动完成下拉框
        hideAutocomplete();
        
        // 重置搜索状态
        currentSearchQuery = query;
        currentSearchPage = 1;
        
        // 显示智能搜索模态框
        const modal = createIntelligentSearchModal(query);
        document.body.appendChild(modal);
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // 模态框关闭时清理DOM
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });
        
        // 执行智能搜索
        await performIntelligentSearch(query, modal, 1);
        
    } catch (error) {
        console.error('智能搜索失败:', error);
        showAlert('智能搜索失败，请重试', 'error');
    }
}

function createIntelligentSearchModal(query) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.id = 'intelligentSearchModal';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-magic me-2"></i>智能搜索相似企业
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="search-info mb-3">
                        <span class="text-muted">搜索关键词：</span>
                        <span class="fw-bold">"${query}"</span>
                    </div>
                    <div id="intelligentSearchResults">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="mt-2">正在智能搜索相似企业...</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="manualInputBtn" onclick="useManualInput('${query}')">
                        <i class="bi bi-pencil me-1"></i>手动输入此名称
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function performIntelligentSearch(query, modal, page = 1) {
    try {
        const response = await fetch('/api/intelligent-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query, page: page })
        });
        
        const result = await response.json();
        const resultsContainer = modal.querySelector('#intelligentSearchResults');
        
        if (result.success && result.data.supplement_triggered) {
            // 触发了数据补充机制
            showDataSupplementProgress(resultsContainer, result.data, modal);
        } else if (result.success && result.data.results.length > 0) {
            displayIntelligentSearchResults(result.data, resultsContainer, modal);
        } else {
            showNoIntelligentResults(resultsContainer, query, modal);
        }
        
    } catch (error) {
        console.error('智能搜索请求失败:', error);
        const resultsContainer = modal.querySelector('#intelligentSearchResults');
        showIntelligentSearchError(resultsContainer);
    }
}

function displayIntelligentSearchResults(data, container, modal) {
    const { results, page, has_more, total_found } = data;
    
    let html = `
        <div class="alert alert-info intelligent-search-info">
            <i class="bi bi-lightbulb me-2"></i>
            找到 ${results.length} 个相似的企业（共${total_found}个），请选择最匹配的一个：
        </div>
        <div class="intelligent-results-list">
    `;
    
    results.forEach((company, index) => {
        // 处理分数：如果已经是百分比就直接使用，否则转换为百分比
        const scorePercentage = company.score > 1 ? Math.round(company.score) : Math.round(company.score * 100);
        const scoreClass = getScoreClass(company.score);
        const externalDataBadge = company.has_external_data ? 
            '<span class="badge bg-success ms-2"><i class="bi bi-database me-1"></i>有资信数据</span>' : 
            '<span class="badge bg-secondary ms-2"><i class="bi bi-database me-1"></i>暂无资信数据</span>';
        
        html += `
            <div class="intelligent-result-item" data-company="${company.name}" data-has-data="${company.has_external_data}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="company-name-large">${company.name}</div>
                        <div class="company-details">
                            <span class="company-description text-muted">${company.description}</span>
                            <span class="match-info ms-2">
                                <span class="badge bg-light text-dark">${getMatchTypeText(company.match_type)}</span>
                            </span>
                            ${externalDataBadge}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="similarity-score ${scoreClass}">
                            相似度 ${scorePercentage}%
                        </div>
                        <button type="button" class="btn btn-primary btn-sm mt-1" onclick="selectIntelligentResult('${company.name}', ${company.has_external_data}, '${modal.id}')">
                            选择此企业
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // 如果还有更多结果，显示"再搜索5条"按钮
    if (has_more) {
        html += `
            <div class="intelligent-search-pagination">
                <p class="text-muted mb-2">没有找到满意的企业？</p>
                <button type="button" class="btn btn-outline-primary me-2" onclick="loadMoreIntelligentResults('${modal.id}')">
                    <i class="bi bi-search me-1"></i>再搜索5条
                </button>
                <button type="button" class="btn btn-outline-success me-2" onclick="triggerAdditionalSupplement('${modal.id}')">
                    <i class="bi bi-plus-circle me-1"></i>继续补充相关企业
                </button>
            </div>
        `;
    } else {
        // 即使没有更多分页结果，也提供继续补充选项
        html += `
            <div class="intelligent-search-pagination">
                <p class="text-muted mb-2">没有找到满意的企业？</p>
                <button type="button" class="btn btn-outline-success me-2" onclick="triggerAdditionalSupplement('${modal.id}')">
                    <i class="bi bi-plus-circle me-1"></i>继续补充相关企业
                </button>
                <button type="button" class="btn btn-outline-info me-2" onclick="showRefineSearchInput('${modal.id}')">
                    <i class="bi bi-pencil me-1"></i>精确搜索
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
    currentSearchPage = page;
}

function showNoIntelligentResults(container, query, modal) {
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            很抱歉，没有找到与 "${query}" 相似的企业。
        </div>
        <div class="text-center py-3">
            <p class="text-muted mb-3">建议：</p>
            <ul class="list-unstyled text-start d-inline-block">
                <li><i class="bi bi-check me-2"></i>检查企业名称是否正确</li>
                <li><i class="bi bi-check me-2"></i>尝试使用企业简称</li>
                <li><i class="bi bi-check me-2"></i>或点击"手动输入此名称"继续</li>
            </ul>
            <div class="mt-3">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                    <i class="bi bi-x-circle me-1"></i>取消搜索
                </button>
            </div>
        </div>
    `;
}

function showIntelligentSearchError(container) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            智能搜索服务暂时不可用，请稍后重试。
        </div>
    `;
}

function showDataSupplementProgress(container, data, modal) {
    const { query, estimated_time, message, suggestion } = data;
    
    container.innerHTML = `
        <div class="alert alert-info data-supplement-alert">
            <div class="d-flex align-items-center mb-3">
                <div class="spinner-border spinner-border-sm text-primary me-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>
                    <h6 class="mb-1">
                        <i class="bi bi-magic me-2"></i>智能数据补充中...
                    </h6>
                    <p class="mb-0 text-muted">${message}</p>
                </div>
            </div>
            
            <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" style="width: 0%" id="supplementProgress">
                </div>
            </div>
            
            <div class="supplement-info">
                <p class="text-muted mb-2">
                    <i class="bi bi-info-circle me-1"></i>
                    ${suggestion}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        预计完成时间：<span id="remainingTime">${estimated_time}</span> 秒
                    </small>
                    <button type="button" class="btn btn-outline-primary btn-sm" 
                            onclick="checkSupplementStatus('${query}', '${modal.id}')" 
                            id="checkStatusBtn">
                        <i class="bi bi-arrow-clockwise me-1"></i>检查进度
                    </button>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-3">
            <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i>取消等待
            </button>
            <button type="button" class="btn btn-primary" onclick="useManualInput('${query}')">
                <i class="bi bi-pencil me-1"></i>直接手动输入
            </button>
        </div>
    `;
    
    // 启动进度条动画和倒计时
    startSupplementProgress(estimated_time, query, modal.id);
}

function startSupplementProgress(estimatedTime, query, modalId) {
    const progressBar = document.getElementById('supplementProgress');
    const remainingTimeSpan = document.getElementById('remainingTime');
    
    let currentTime = 0;
    const interval = 100; // 每100ms更新一次
    const totalSteps = (estimatedTime * 1000) / interval;
    
    const timer = setInterval(() => {
        currentTime += interval;
        const progress = Math.min((currentTime / (estimatedTime * 1000)) * 100, 100);
        const remainingSeconds = Math.max(0, estimatedTime - Math.floor(currentTime / 1000));
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (remainingTimeSpan) {
            remainingTimeSpan.textContent = remainingSeconds;
        }
        
        // 当进度达到100%时，自动检查状态
        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                checkSupplementStatus(query, modalId);
            }, 500);
        }
    }, interval);
    
    // 存储定时器ID，以便需要时可以清除
    window.supplementTimer = timer;
}

async function checkSupplementStatus(query, modalId) {
    try {
        const checkBtn = document.getElementById('checkStatusBtn');
        if (checkBtn) {
            checkBtn.disabled = true;
            checkBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>检查中...';
        }
        
        const response = await fetch(`/api/data-supplement-status?query=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success && result.data.has_new_results) {
            // 有新结果，重新执行智能搜索
            const modal = document.getElementById(modalId);
            showAlert(`数据补充完成！为"${query}"找到了 ${result.data.results_count} 个相关企业`, 'success');
            
            // 清除补充进度定时器
            if (window.supplementTimer) {
                clearInterval(window.supplementTimer);
            }
            
            // 重新搜索
            await performIntelligentSearch(query, modal, 1);
        } else {
            // 还没有新结果
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>检查进度';
            }
            
            showAlert(result.data.message || '数据补充仍在进行中，请稍后再试', 'info');
        }
        
    } catch (error) {
        console.error('检查补充状态失败:', error);
        const checkBtn = document.getElementById('checkStatusBtn');
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>检查进度';
        }
        showAlert('检查状态失败，请重试', 'error');
    }
}

function getScoreClass(score) {
    // 处理百分比分数(0-100)和小数分数(0-1)
    const normalizedScore = score > 1 ? score / 100 : score;
    
    if (normalizedScore >= 0.8) return 'score-excellent';
    if (normalizedScore >= 0.6) return 'score-good';
    if (normalizedScore >= 0.4) return 'score-fair';
    return 'score-poor';
}

async function selectIntelligentResult(companyName, hasExternalData, modalId) {
    try {
        // 填充企业名称到输入框
        const customerNameInput = document.getElementById('customerName');
        customerNameInput.value = companyName;
        
        // 关闭模态框
        const modal = document.getElementById(modalId);
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
        
        // 更新当前企业名称显示
        updateCurrentCompanyName();
        
        // 如果有外部数据，自动拉取资信信息
        if (hasExternalData) {
            showAlert(`已选择企业：${companyName}，正在自动拉取资信数据...`, 'info');
            await autoFillCompanyInfo();
        } else {
            showAlert(`已选择企业：${companyName}`, 'success');
        }
        
        // 添加到企业数据库
        await addCompanyToDatabase(companyName);
        
    } catch (error) {
        console.error('选择企业失败:', error);
        showAlert('选择企业失败，请重试', 'error');
    }
}

async function loadMoreIntelligentResults(modalId) {
    try {
        const modal = document.getElementById(modalId);
        const resultsContainer = modal.querySelector('#intelligentSearchResults');
        
        // 显示加载状态
        const loadMoreBtn = resultsContainer.querySelector('button[onclick*="loadMoreIntelligentResults"]');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>正在搜索...';
        }
        
        // 搜索下一页
        currentSearchPage += 1;
        await performIntelligentSearch(currentSearchQuery, modal, currentSearchPage);
        
    } catch (error) {
        console.error('加载更多搜索结果失败:', error);
        showAlert('加载更多搜索结果失败，请重试', 'error');
    }
}

function useManualInput(query) {
    // 填充查询内容到输入框
    const customerNameInput = document.getElementById('customerName');
    customerNameInput.value = query;
    
    // 关闭模态框
    const modal = document.getElementById('intelligentSearchModal');
    const modalInstance = bootstrap.Modal.getInstance(modal);
    modalInstance.hide();
    
    // 更新当前企业名称显示
    updateCurrentCompanyName();
    
    // 添加到企业数据库
    addCompanyToDatabase(query);
    
    showAlert(`已手动输入企业名称：${query}`, 'success');
}

function showAlert(message, type = 'info') {
    // 创建提示框
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

async function triggerAdditionalSupplement(modalId) {
    // 手动触发额外的数据补充
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const queryElement = modal.querySelector('.search-info .fw-bold');
    if (!queryElement) return;
    
    const query = queryElement.textContent.replace(/["""]/g, '').trim();
    const resultsContainer = modal.querySelector('#intelligentSearchResults');
    
    try {
        // 显示补充进度
        resultsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-2">正在继续补充 "${query}" 的相关企业...</div>
                <p class="text-muted mt-2">正在扩展搜索范围，寻找更多相关企业</p>
            </div>
        `;
        
        // 调用智能搜索API（强制触发补充）
        const response = await fetch('/api/intelligent-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query: query + ' 扩展', // 添加"扩展"关键词强制触发
                page: 1
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data.supplement_triggered) {
            showDataSupplementProgress(resultsContainer, result.data, modal);
        } else {
            showAlert('数据补充服务暂时不可用，请稍后重试', 'warning');
            // 重新搜索原始查询
            await performIntelligentSearch(query, modal, 1);
        }
        
    } catch (error) {
        console.error('触发额外补充失败:', error);
        showAlert('补充失败，请重试', 'error');
    }
}

function showRefineSearchInput(modalId) {
    // 显示精确搜索输入框
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const queryElement = modal.querySelector('.search-info .fw-bold');
    if (!queryElement) return;
    
    const originalQuery = queryElement.textContent.replace(/["""]/g, '').trim();
    const resultsContainer = modal.querySelector('#intelligentSearchResults');
    
    resultsContainer.innerHTML = `
        <div class="refine-search-container">
            <div class="alert alert-info">
                <i class="bi bi-lightbulb me-2"></i>
                <strong>精确搜索提示：</strong>您可以添加更多关键词来精确搜索企业
            </div>
            
            <div class="mb-3">
                <label class="form-label">基于原始查询进行精确搜索：</label>
                <div class="input-group">
                    <span class="input-group-text bg-light">"${originalQuery}"</span>
                    <input type="text" class="form-control" id="refineSearchInput" 
                           placeholder="添加更多关键词，如：光电、技术、设备等">
                    <button class="btn btn-primary" onclick="performRefineSearch('${modalId}', '${originalQuery}')">
                        <i class="bi bi-search me-1"></i>精确搜索
                    </button>
                </div>
                <div class="form-text">
                    例如：在"维斯登"基础上添加"光电设备"，搜索"维斯登光电设备"
                </div>
            </div>
            
            <div class="text-center">
                <button type="button" class="btn btn-outline-secondary" onclick="performIntelligentSearch('${originalQuery}', document.getElementById('${modalId}'), 1)">
                    <i class="bi bi-arrow-left me-1"></i>返回原始搜索结果
                </button>
            </div>
        </div>
    `;
    
    // 聚焦到输入框
    setTimeout(() => {
        const input = document.getElementById('refineSearchInput');
        if (input) {
            input.focus();
            // 回车键搜索
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performRefineSearch(modalId, originalQuery);
                }
            });
        }
    }, 100);
}

async function performRefineSearch(modalId, originalQuery) {
    // 执行精确搜索
    const input = document.getElementById('refineSearchInput');
    if (!input) return;
    
    const additionalKeywords = input.value.trim();
    if (!additionalKeywords) {
        showAlert('请输入要添加的关键词', 'warning');
        return;
    }
    
    const refinedQuery = originalQuery + additionalKeywords;
    const modal = document.getElementById(modalId);
    
    // 更新模态框中显示的查询
    const queryElement = modal.querySelector('.search-info .fw-bold');
    if (queryElement) {
        queryElement.textContent = `"${refinedQuery}"`;
    }
    
    // 执行新的智能搜索
    await performIntelligentSearch(refinedQuery, modal, 1);
}

 
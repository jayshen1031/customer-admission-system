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
        return selected ? selected.closest('.form-check').querySelector('label').textContent.trim() : '';
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
        default: return 'c-bg';
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

 
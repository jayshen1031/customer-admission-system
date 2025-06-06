// 主页面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化
    initRatingOptions();
    initForm();
    initCompanyAutocomplete();
    initDepartmentAutocomplete();
    
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

// 部门自动补全功能
let departmentAutocompleteTimeout;
let currentDepartmentSuggestionIndex = -1;
let departmentAutocompleteVisible = false;

function initDepartmentAutocomplete() {
    const departmentInput = document.getElementById('submitterDepartment');
    const autocompleteContainer = document.getElementById('departmentAutocomplete');
    
    if (!departmentInput || !autocompleteContainer) return;
    
    // 输入事件
    departmentInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        // 清除之前的超时
        if (departmentAutocompleteTimeout) {
            clearTimeout(departmentAutocompleteTimeout);
        }
        
        // 延迟搜索，避免频繁请求
        departmentAutocompleteTimeout = setTimeout(() => {
            if (query.length >= 1) {
                searchDepartments(query);
            } else if (query.length === 0) {
                showPopularDepartments();
            } else {
                hideDepartmentAutocomplete();
            }
        }, 200);
    });
    
    // 焦点事件
    departmentInput.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 1) {
            searchDepartments(query);
        } else if (query.length === 0) {
            showPopularDepartments();
        }
    });
    
    // 失去焦点事件
    departmentInput.addEventListener('blur', function() {
        // 延迟隐藏，确保点击建议项有效
        setTimeout(() => {
            hideDepartmentAutocomplete();
        }, 200);
    });
    
    // 键盘导航
    departmentInput.addEventListener('keydown', function(e) {
        if (!departmentAutocompleteVisible) return;
        
        const suggestions = autocompleteContainer.querySelectorAll('.department-suggestion');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentDepartmentSuggestionIndex = Math.min(currentDepartmentSuggestionIndex + 1, suggestions.length - 1);
                updateDepartmentSuggestionSelection(suggestions);
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentDepartmentSuggestionIndex = Math.max(currentDepartmentSuggestionIndex - 1, -1);
                updateDepartmentSuggestionSelection(suggestions);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentDepartmentSuggestionIndex >= 0 && suggestions[currentDepartmentSuggestionIndex]) {
                    selectDepartmentSuggestion(suggestions[currentDepartmentSuggestionIndex]);
                }
                break;
            case 'Escape':
                hideDepartmentAutocomplete();
                break;
        }
    });
    
    // 点击外部区域隐藏建议
    document.addEventListener('click', function(e) {
        if (!departmentInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            hideDepartmentAutocomplete();
        }
    });
}

async function searchDepartments(query) {
    try {
        showDepartmentAutocompleteLoading();
        
        const response = await fetch(`/api/department-autocomplete?q=${encodeURIComponent(query)}&limit=8`);
        const result = await response.json();
        
        if (result.success && result.data.suggestions.length > 0) {
            showDepartmentSuggestions(result.data.suggestions, query);
        } else {
            showNoDepartmentResults(query);
        }
    } catch (error) {
        console.error('搜索部门失败:', error);
        showDepartmentAutocompleteError();
    }
}

async function showPopularDepartments() {
    try {
        const response = await fetch('/api/department-autocomplete?limit=8');
        const result = await response.json();
        
        if (result.success && result.data.suggestions.length > 0) {
            showDepartmentSuggestions(result.data.suggestions, '', true);
        }
    } catch (error) {
        console.error('获取热门部门失败:', error);
    }
}

function showDepartmentSuggestions(suggestions, query, isPopular = false) {
    const autocompleteContainer = document.getElementById('departmentAutocomplete');
    
    let html = '';
    
    if (isPopular) {
        html += '<div class="autocomplete-hint"><i class="bi bi-building me-1"></i> 常用部门推荐</div>';
    }
    
    suggestions.forEach((suggestion, index) => {
        html += `
            <div class="department-suggestion autocomplete-suggestion" data-index="${index}" data-department="${suggestion.name}">
                <span class="department-name">${highlightMatch(suggestion.name, query)}</span>
                <span class="usage-count text-muted">使用${suggestion.count || 0}次</span>
            </div>
        `;
    });
    
    autocompleteContainer.innerHTML = html;
    autocompleteContainer.style.display = 'block';
    departmentAutocompleteVisible = true;
    currentDepartmentSuggestionIndex = -1;
    
    // 绑定点击事件
    autocompleteContainer.querySelectorAll('.department-suggestion').forEach(item => {
        item.addEventListener('click', function() {
            selectDepartmentSuggestion(this);
        });
    });
}

function showDepartmentAutocompleteLoading() {
    const autocompleteContainer = document.getElementById('departmentAutocomplete');
    autocompleteContainer.innerHTML = `
        <div class="autocomplete-loading">
            <i class="bi bi-search me-2"></i>正在搜索...
        </div>
    `;
    autocompleteContainer.style.display = 'block';
    departmentAutocompleteVisible = true;
}

function showNoDepartmentResults(query) {
    const autocompleteContainer = document.getElementById('departmentAutocomplete');
    autocompleteContainer.innerHTML = `
        <div class="autocomplete-empty">
            <i class="bi bi-info-circle me-2"></i>未找到匹配的部门，将创建新部门记录
        </div>
    `;
    autocompleteContainer.style.display = 'block';
    departmentAutocompleteVisible = true;
}

function showDepartmentAutocompleteError() {
    const autocompleteContainer = document.getElementById('departmentAutocomplete');
    autocompleteContainer.innerHTML = `
        <div class="autocomplete-empty">
            <i class="bi bi-exclamation-triangle me-2"></i>搜索失败，请重试
        </div>
    `;
    autocompleteContainer.style.display = 'block';
    departmentAutocompleteVisible = true;
}

function hideDepartmentAutocomplete() {
    const autocompleteContainer = document.getElementById('departmentAutocomplete');
    autocompleteContainer.style.display = 'none';
    departmentAutocompleteVisible = false;
    currentDepartmentSuggestionIndex = -1;
}

function updateDepartmentSuggestionSelection(suggestions) {
    suggestions.forEach((suggestion, index) => {
        if (index === currentDepartmentSuggestionIndex) {
            suggestion.classList.add('selected');
        } else {
            suggestion.classList.remove('selected');
        }
    });
}

function selectDepartmentSuggestion(suggestionElement) {
    const departmentName = suggestionElement.getAttribute('data-department');
    const departmentInput = document.getElementById('submitterDepartment');
    
    departmentInput.value = departmentName;
    hideDepartmentAutocomplete();
    
    // 触发change事件
    departmentInput.dispatchEvent(new Event('change', { bubbles: true }));
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
    const submitterName = document.getElementById('submitterName').value.trim();
    const submitterDepartment = document.getElementById('submitterDepartment').value.trim();
    
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
    
    if (!submitterName) {
        alert('请输入提交人姓名');
        document.getElementById('submitterName').focus();
        return false;
    }
    
    if (!submitterDepartment) {
        alert('请输入所属部门');
        document.getElementById('submitterDepartment').focus();
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
        submitter_name: document.getElementById('submitterName').value.trim(),
        submitter_department: document.getElementById('submitterDepartment').value.trim(),
        submitter_department_text: document.getElementById('submitterDepartment').value.trim(),
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
    // 初始化商机预估评分交互
    setupProfitEstimateInteraction();
    addProfitSelectAnimation();
    
    // 为资信评分表单添加变更事件
    const creditForm = document.getElementById('creditRatingForm');
    if (creditForm) {
        creditForm.addEventListener('change', calculateCreditScore);
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
            
            // 清除商机预估评分的选中状态
            document.querySelectorAll('.profit-card').forEach(card => {
                card.classList.remove('profit-selected');
            });
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

// 设置商机预估评分的交互效果
function setupProfitEstimateInteraction() {
    const profitRadios = document.querySelectorAll('input[name="profitEstimate"]');
    console.log(`🎯 找到 ${profitRadios.length} 个商机预估选项`);
    
    profitRadios.forEach((radio, index) => {
        console.log(`📌 绑定事件监听器到选项 ${index + 1}: ${radio.id}`);
        
        radio.addEventListener('change', function() {
            console.log(`✅ 商机预估选项被选中: ${this.id} (值: ${this.value})`);
            
            // 移除所有选中状态
            const allCards = document.querySelectorAll('.profit-card');
            console.log(`🔄 清除 ${allCards.length} 个卡片的选中状态`);
            allCards.forEach(card => {
                card.classList.remove('profit-selected');
            });
            
            // 为当前选中的添加状态
            if (this.checked) {
                // 找到包含当前radio的profit-card
                const selectedCard = this.closest('.profit-card');
                console.log(`🎯 找到选中的卡片:`, selectedCard);
                
                if (selectedCard) {
                    selectedCard.classList.add('profit-selected');
                    console.log(`🎨 已添加 profit-selected 类到卡片`);
                    
                    // 添加选中动画
                    selectedCard.style.animation = 'none';
                    selectedCard.offsetHeight; // 触发重排
                    selectedCard.style.animation = 'profitSelectAnimation 0.4s ease-out';
                    console.log(`🎬 已添加选中动画`);
                } else {
                    console.error(`❌ 无法找到包含 ${this.id} 的 .profit-card 元素`);
                }
            }
        });
    });
    
    console.log(`✅ 商机预估评分交互设置完成`);
}

// 商机预估评分选中动画样式（通过JavaScript动态添加到CSS）
function addProfitSelectAnimation() {
    // 检查是否已经添加过样式
    if (document.getElementById('profit-select-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'profit-select-styles';
    style.textContent = `
        /* 商机预估评分选中效果 - 高优先级样式 */
        .profit-card.profit-selected {
            border-color: #667eea !important;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4) !important;
            transform: translateY(-3px) !important;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(102, 126, 234, 0.06) 100%) !important;
            position: relative !important;
            z-index: 10 !important;
        }
        
        .profit-card.profit-selected::before {
            height: 6px !important;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4) !important;
        }
        
        .profit-card.profit-selected .profit-title {
            color: #667eea !important;
            font-weight: 800 !important;
        }
        
        .profit-card.profit-selected .profit-icon {
            transform: scale(1.2) !important;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
        }
        
        .profit-card.profit-selected .profit-score {
            color: #667eea !important;
            animation: scoreGlow 0.8s ease-in-out infinite alternate !important;
            text-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
            font-weight: 900 !important;
        }
        
        .profit-card.profit-selected .profit-badge {
            transform: scale(1.15) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        .profit-card.profit-selected .profit-desc {
            color: #4b5563 !important;
            font-weight: 600 !important;
        }
        
        /* 覆盖悬停效果 */
        .profit-card.profit-selected:hover {
            transform: translateY(-3px) !important;
            border-color: #667eea !important;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5) !important;
        }
        
        @keyframes profitSelectAnimation {
            0% { 
                transform: translateY(0) scale(1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            50% { 
                transform: translateY(-5px) scale(1.03);
                box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
            }
            100% { 
                transform: translateY(-3px) scale(1);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            }
        }
        
        @keyframes scoreGlow {
            0% { 
                opacity: 1; 
                transform: scale(1);
                text-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }
            100% { 
                opacity: 0.8; 
                transform: scale(1.05);
                text-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ 商机预估评分样式已添加');
}

// ===============================
// 管理员登录功能
// ===============================
function showAdminLogin() {
    // 显示管理员登录模态框
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    
    // 清空之前的输入和错误信息
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginError').classList.add('d-none');
    
    modal.show();
    
    // 聚焦到密码输入框
    setTimeout(() => {
        document.getElementById('adminPassword').focus();
    }, 300);
}

function verifyAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminLoginError');
    
    // 验证密码（初始密码：yusan）
    if (password === 'yusan') {
        // 密码正确，跳转到管理界面
        errorDiv.classList.add('d-none');
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
        modal.hide();
        
        // 跳转到管理界面
        window.location.href = '/internal-admin-panel-x9k2m8p5';
    } else {
        // 密码错误，显示错误信息
        errorDiv.classList.remove('d-none');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// 添加回车键登录支持
document.addEventListener('DOMContentLoaded', function() {
    const adminPasswordInput = document.getElementById('adminPassword');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyAdminLogin();
            }
        });
    }
});

 
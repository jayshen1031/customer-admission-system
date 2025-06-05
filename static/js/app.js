// 主页面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化
    initRatingOptions();
    initForm();
});

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

// 初始化表单事件
function initForm() {
    const form = document.getElementById('ratingForm');
    
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
        }, 100);
    });
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
    const requiredFields = ['industry', 'businessType', 'influence', 'logisticsScale', 'creditScore', 'profitEstimate'];
    
    for (const field of requiredFields) {
        const selectedInput = document.querySelector(`input[name="${field}"]:checked`);
        if (!selectedInput) {
            alert(`请选择${getFieldDisplayName(field)}`);
            return false;
        }
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
        credit_score: getSelectedValue('creditScore'),
        credit_detail: getSelectedText('creditScore'),
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
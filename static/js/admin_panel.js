// 管理员审批面板JavaScript

let currentPage = 1;
let currentAction = null;
let currentRecordId = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadAdminStats();
    loadDeletedRecords(1);
    
    // 绑定事件
    document.getElementById('confirmButton').addEventListener('click', executeAction);
    document.getElementById('submitReject').addEventListener('click', submitRejectReason);
});

// 加载统计信息
async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalRecords').textContent = data.data.total_records;
            document.getElementById('activeRecords').textContent = data.data.active_records;
            document.getElementById('pendingDelete').textContent = data.data.pending_delete;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('加载统计信息失败:', error);
        showAlert('加载统计信息失败：' + error.message, 'danger');
    }
}

// 加载待删除记录
async function loadDeletedRecords(page = 1) {
    currentPage = page;
    
    try {
        const response = await fetch(`/api/admin/deleted-records?page=${page}&per_page=5`);
        const data = await response.json();
        
        if (data.success) {
            renderDeletedRecords(data.data.records);
            renderPagination(data.data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('加载删除记录失败:', error);
        document.getElementById('deletedRecordsContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                加载数据失败：${error.message}
            </div>
        `;
    }
}

// 渲染删除记录列表
function renderDeletedRecords(records) {
    const container = document.getElementById('deletedRecordsContainer');
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h5>暂无待审批的删除记录</h5>
                <p class="text-muted">所有删除请求都已处理完毕</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    records.forEach(record => {
        html += `
            <div class="deleted-record">
                <div class="record-meta">
                    <span class="badge bg-warning">待审批</span>
                    <span class="ms-2">ID: ${record.id}</span>
                    <span class="ms-2">删除时间: ${record.deleted_at}</span>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <strong>客户名称：</strong>
                        <span class="customer-name">${record.customer_name}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>客户类型：</strong>
                        ${getCustomerTypeText(record.customer_type)}
                    </div>
                    <div class="col-md-3">
                        <strong>评级等级：</strong>
                        <span class="badge bg-${getGradeColor(record.grade)}">${record.grade}</span>
                    </div>
                </div>
                
                <div class="row mt-2">
                    <div class="col-md-4">
                        <strong>总分：</strong> ${record.total_score}分
                    </div>
                    <div class="col-md-4">
                        <strong>创建时间：</strong> ${record.created_at}
                    </div>
                    <div class="col-md-4">
                        <strong>行业评分：</strong> ${record.industry_score}分
                    </div>
                </div>
                
                <div class="delete-reason">
                    <strong>删除原因：</strong> ${record.deleted_reason || '无'}
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-approve btn-sm me-2" onclick="confirmApprove(${record.id}, '${record.customer_name}')">
                        <i class="fas fa-check"></i> 批准删除
                    </button>
                    <button class="btn btn-reject btn-sm me-2" onclick="showRejectModal(${record.id}, '${record.customer_name}')">
                        <i class="fas fa-times"></i> 拒绝删除
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="viewRecordDetail(${record.id})">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 渲染分页导航
function renderPagination(data) {
    const container = document.getElementById('paginationContainer');
    const pagination = document.getElementById('pagination');
    
    if (data.pages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    let html = '';
    
    // 上一页
    html += `
        <li class="page-item ${data.current_page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDeletedRecords(${data.current_page - 1}); return false;">上一页</a>
        </li>
    `;
    
    // 页码
    for (let i = 1; i <= data.pages; i++) {
        html += `
            <li class="page-item ${i === data.current_page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadDeletedRecords(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 下一页
    html += `
        <li class="page-item ${data.current_page === data.pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDeletedRecords(${data.current_page + 1}); return false;">下一页</a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// 确认批准删除
function confirmApprove(recordId, customerName) {
    currentAction = 'approve';
    currentRecordId = recordId;
    
    document.getElementById('confirmModalTitle').textContent = '确认批准删除';
    document.getElementById('confirmModalBody').innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>警告：</strong>此操作将永久删除客户记录，无法恢复！
        </div>
        <p>您确定要批准删除以下客户记录吗？</p>
        <div class="bg-light p-3 rounded">
            <strong>客户名称：</strong>${customerName}<br>
            <strong>记录ID：</strong>${recordId}
        </div>
    `;
    
    document.getElementById('confirmButton').className = 'btn btn-danger';
    document.getElementById('confirmButton').innerHTML = '<i class="fas fa-check"></i> 确认删除';
    
    new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

// 显示拒绝模态框
function showRejectModal(recordId, customerName) {
    currentRecordId = recordId;
    
    document.getElementById('rejectReason').value = '';
    
    new bootstrap.Modal(document.getElementById('rejectModal')).show();
}

// 提交拒绝原因
async function submitRejectReason() {
    const reason = document.getElementById('rejectReason').value.trim();
    
    if (!reason) {
        showAlert('请输入拒绝原因', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/reject-delete/${currentRecordId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('rejectModal')).hide();
            loadDeletedRecords(currentPage);
            loadAdminStats();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('拒绝删除失败:', error);
        showAlert('拒绝删除失败：' + error.message, 'danger');
    }
}

// 执行审批操作
async function executeAction() {
    if (!currentAction || !currentRecordId) return;
    
    try {
        let url;
        if (currentAction === 'approve') {
            url = `/api/admin/approve-delete/${currentRecordId}`;
        } else {
            return;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
            loadDeletedRecords(currentPage);
            loadAdminStats();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('操作失败:', error);
        showAlert('操作失败：' + error.message, 'danger');
    }
    
    currentAction = null;
    currentRecordId = null;
}

// 查看记录详情（简化版）
function viewRecordDetail(recordId) {
    // 这里可以实现详细信息的模态框
    showAlert('详情功能开发中...', 'info');
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// 辅助函数：获取客户类型文本
function getCustomerTypeText(type) {
    const typeMap = {
        'direct': '直客',
        'global': '全球客户',
        'overseas': '海外客户',
        'peer': '同行'
    };
    return typeMap[type] || type;
}

// 辅助函数：获取等级颜色
function getGradeColor(grade) {
    const colorMap = {
        'A+': 'success',
        'A': 'primary',
        'B': 'warning',
        'C': 'danger'
    };
    return colorMap[grade] || 'secondary';
} 
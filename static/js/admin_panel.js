// 管理员审批面板JavaScript

let currentPage = 1;
let selectedRecords = new Set();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadAdminStats();
    loadDeletedRecords(1);
    
    // 绑定批量操作事件
    document.getElementById('confirmBatchDelete').addEventListener('click', executeBatchDelete);
    document.getElementById('confirmBatchRestore').addEventListener('click', executeBatchRestore);
    document.getElementById('confirmSingleAction').addEventListener('click', executeSingleAction);
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
        showToast('加载统计信息失败：' + error.message, 'error');
    }
}

// 加载待删除记录
async function loadDeletedRecords(page = 1) {
    currentPage = page;
    
    // 显示加载指示器
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('deletedRecordsTable').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'none';
    
    try {
        const response = await fetch(`/api/admin/deleted-records?page=${page}&per_page=10`);
        const data = await response.json();
        
        document.getElementById('loadingIndicator').style.display = 'none';
        
        if (data.success) {
            if (data.data.records.length === 0) {
                document.getElementById('noDataMessage').style.display = 'block';
            } else {
                renderDeletedRecords(data.data.records);
                renderPagination(data.data);
                document.getElementById('deletedRecordsTable').style.display = 'block';
            }
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('加载删除记录失败:', error);
        document.getElementById('loadingIndicator').style.display = 'none';
        showToast('加载数据失败：' + error.message, 'error');
    }
}

// 渲染删除记录列表
function renderDeletedRecords(records) {
    const tbody = document.getElementById('deletedRecordsTableBody');
    
    let html = '';
    records.forEach((record, index) => {
        const rowNumber = (currentPage - 1) * 10 + index + 1;
        html += `
            <tr class="record-row" data-record-id="${record.id}">
                <td>
                    <input type="checkbox" class="form-check-input record-checkbox" 
                           value="${record.id}" onchange="updateSelectedCount()">
                </td>
                <td>${rowNumber}</td>
                <td>
                    <div class="fw-bold text-primary">${record.customer_name}</div>
                    <small class="text-muted">ID: ${record.id}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${getCustomerTypeText(record.customer_type)}</span>
                </td>
                <td>
                    <div>${record.submitter_name || '-'}</div>
                    <small class="text-muted">${record.submitter_department || ''}</small>
                </td>
                <td>
                    <span class="fw-bold">${record.total_score}</span>分
                </td>
                <td>
                    <span class="badge bg-${getGradeColor(record.grade)} grade-badge">${record.grade}</span>
                </td>
                <td>
                    <div>${record.deleted_at}</div>
                    <small class="text-muted">删除时间</small>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 150px;" title="${record.deleted_reason || '无'}">
                        ${record.deleted_reason || '无'}
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="showSingleActionModal('delete', ${record.id}, '${record.customer_name}')"
                                title="强制删除">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm" 
                                onclick="showSingleActionModal('restore', ${record.id}, '${record.customer_name}')"
                                title="恢复记录">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" 
                                onclick="viewRecordDetail(${record.id})"
                                title="查看详情">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // 重置选择状态
    selectedRecords.clear();
    updateSelectedCount();
    document.getElementById('selectAll').checked = false;
}

// 渲染分页导航
function renderPagination(data) {
    const nav = document.getElementById('paginationNav');
    const pagination = document.getElementById('pagination');
    
    if (data.pages <= 1) {
        nav.style.display = 'none';
        return;
    }
    
    nav.style.display = 'block';
    
    let html = '';
    
    // 上一页
    html += `
        <li class="page-item ${data.current_page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDeletedRecords(${data.current_page - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // 页码
    const startPage = Math.max(1, data.current_page - 2);
    const endPage = Math.min(data.pages, data.current_page + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="loadDeletedRecords(1); return false;">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === data.current_page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadDeletedRecords(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < data.pages) {
        if (endPage < data.pages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="loadDeletedRecords(${data.pages}); return false;">${data.pages}</a></li>`;
    }
    
    // 下一页
    html += `
        <li class="page-item ${data.current_page === data.pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDeletedRecords(${data.current_page + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// 全选/取消全选
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.record-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        if (selectAll.checked) {
            selectedRecords.add(parseInt(checkbox.value));
        } else {
            selectedRecords.delete(parseInt(checkbox.value));
        }
    });
    
    updateSelectedCount();
}

// 更新选中计数
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.record-checkbox:checked');
    selectedRecords.clear();
    
    checkboxes.forEach(checkbox => {
        selectedRecords.add(parseInt(checkbox.value));
    });
    
    const count = selectedRecords.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('selectedCountRestore').textContent = count;
    
    // 更新按钮状态
    document.getElementById('batchDeleteBtn').disabled = count === 0;
    document.getElementById('batchRestoreBtn').disabled = count === 0;
    
    // 更新全选框状态
    const allCheckboxes = document.querySelectorAll('.record-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.record-checkbox:checked');
    const selectAll = document.getElementById('selectAll');
    
    if (checkedCheckboxes.length === 0) {
        selectAll.indeterminate = false;
        selectAll.checked = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAll.indeterminate = false;
        selectAll.checked = true;
    } else {
        selectAll.indeterminate = true;
        selectAll.checked = false;
    }
}

// 批量强制删除
function batchForceDelete() {
    if (selectedRecords.size === 0) return;
    
    // 获取选中记录的信息
    const selectedInfo = [];
    selectedRecords.forEach(id => {
        const row = document.querySelector(`tr[data-record-id="${id}"]`);
        if (row) {
            const customerName = row.cells[2].querySelector('.fw-bold').textContent;
            selectedInfo.push({ id, name: customerName });
        }
    });
    
    // 填充模态框
    document.getElementById('deleteCount').textContent = selectedRecords.size;
    const deleteList = document.getElementById('deleteList');
    deleteList.innerHTML = selectedInfo.map(info => 
        `<li class="mb-1"><i class="bi bi-dash me-2"></i><strong>${info.name}</strong> (ID: ${info.id})</li>`
    ).join('');
    
    new bootstrap.Modal(document.getElementById('batchDeleteModal')).show();
}

// 批量恢复
function batchRestore() {
    if (selectedRecords.size === 0) return;
    
    // 获取选中记录的信息
    const selectedInfo = [];
    selectedRecords.forEach(id => {
        const row = document.querySelector(`tr[data-record-id="${id}"]`);
        if (row) {
            const customerName = row.cells[2].querySelector('.fw-bold').textContent;
            selectedInfo.push({ id, name: customerName });
        }
    });
    
    // 填充模态框
    document.getElementById('restoreCount').textContent = selectedRecords.size;
    const restoreList = document.getElementById('restoreList');
    restoreList.innerHTML = selectedInfo.map(info => 
        `<li class="mb-1"><i class="bi bi-dash me-2"></i><strong>${info.name}</strong> (ID: ${info.id})</li>`
    ).join('');
    
    // 清空恢复原因
    document.getElementById('restoreReason').value = '';
    
    new bootstrap.Modal(document.getElementById('batchRestoreModal')).show();
}

// 执行批量删除
async function executeBatchDelete() {
    const selectedIds = Array.from(selectedRecords);
    
    try {
        for (const id of selectedIds) {
            const response = await fetch(`/api/admin/approve-delete/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(`删除记录 ${id} 失败: ${result.error}`);
            }
        }
        
        bootstrap.Modal.getInstance(document.getElementById('batchDeleteModal')).hide();
        showToast(`成功强制删除 ${selectedIds.length} 条记录`, 'success');
        
        // 刷新数据
        await loadAdminStats();
        await loadDeletedRecords(currentPage);
        
    } catch (error) {
        console.error('批量删除失败:', error);
        showToast('批量删除失败：' + error.message, 'error');
    }
}

// 执行批量恢复
async function executeBatchRestore() {
    const selectedIds = Array.from(selectedRecords);
    const reason = document.getElementById('restoreReason').value.trim();
    
    if (!reason) {
        showToast('请输入恢复原因', 'warning');
        return;
    }
    
    try {
        for (const id of selectedIds) {
            const response = await fetch(`/api/admin/reject-delete/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(`恢复记录 ${id} 失败: ${result.error}`);
            }
        }
        
        bootstrap.Modal.getInstance(document.getElementById('batchRestoreModal')).hide();
        showToast(`成功恢复 ${selectedIds.length} 条记录`, 'success');
        
        // 刷新数据
        await loadAdminStats();
        await loadDeletedRecords(currentPage);
        
    } catch (error) {
        console.error('批量恢复失败:', error);
        showToast('批量恢复失败：' + error.message, 'error');
    }
}

// 显示单个操作模态框
function showSingleActionModal(action, recordId, customerName) {
    const modal = document.getElementById('singleActionModal');
    const header = document.getElementById('singleActionHeader');
    const title = document.getElementById('singleActionTitle');
    const body = document.getElementById('singleActionBody');
    const confirmBtn = document.getElementById('confirmSingleAction');
    
    if (action === 'delete') {
        header.className = 'modal-header bg-danger text-white';
        title.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>确认强制删除';
        body.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>危险操作：</strong>此操作将永久删除记录，无法恢复！
            </div>
            <p>您确定要强制删除以下记录吗？</p>
            <div class="bg-light p-3 rounded">
                <strong>客户名称：</strong>${customerName}<br>
                <strong>记录ID：</strong>${recordId}
            </div>
        `;
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.innerHTML = '<i class="bi bi-trash-fill me-1"></i>确认删除';
        confirmBtn.onclick = () => executeSingleAction('delete', recordId);
    } else if (action === 'restore') {
        header.className = 'modal-header bg-success text-white';
        title.innerHTML = '<i class="bi bi-arrow-counterclockwise me-2"></i>确认恢复记录';
        body.innerHTML = `
            <p>您确定要恢复以下记录吗？</p>
            <div class="bg-light p-3 rounded mb-3">
                <strong>客户名称：</strong>${customerName}<br>
                <strong>记录ID：</strong>${recordId}
            </div>
            <div class="mb-3">
                <label for="singleRestoreReason" class="form-label">恢复原因：</label>
                <textarea class="form-control" id="singleRestoreReason" rows="3" placeholder="请输入恢复记录的原因..."></textarea>
            </div>
        `;
        confirmBtn.className = 'btn btn-success';
        confirmBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-1"></i>确认恢复';
        confirmBtn.onclick = () => executeSingleAction('restore', recordId);
    }
    
    new bootstrap.Modal(modal).show();
}

// 执行单个操作
async function executeSingleAction(action, recordId) {
    try {
        let url, method, body = null;
        
        if (action === 'delete') {
            url = `/api/admin/approve-delete/${recordId}`;
            method = 'POST';
        } else if (action === 'restore') {
            const reason = document.getElementById('singleRestoreReason').value.trim();
            if (!reason) {
                showToast('请输入恢复原因', 'warning');
                return;
            }
            url = `/api/admin/reject-delete/${recordId}`;
            method = 'POST';
            body = JSON.stringify({ reason });
        }
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });
        
        const result = await response.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('singleActionModal')).hide();
            showToast(result.message, 'success');
            
            // 刷新数据
            await loadAdminStats();
            await loadDeletedRecords(currentPage);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('操作失败:', error);
        showToast('操作失败：' + error.message, 'error');
    }
}

// 查看记录详情
function viewRecordDetail(recordId) {
    // 这里可以实现查看详情的功能
    showToast('详情查看功能开发中...', 'info');
}

// 刷新删除记录
function refreshDeletedRecords() {
    loadDeletedRecords(currentPage);
    showToast('数据已刷新', 'info');
}

// 显示Toast通知
function showToast(message, type = 'info') {
    // 创建toast容器（如果不存在）
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // 创建toast元素
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="bi bi-${getToastIcon(type)} me-2 text-${type === 'error' ? 'danger' : type}"></i>
                <strong class="me-auto">系统通知</strong>
                <small class="text-muted">刚刚</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // 显示toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // 自动清理
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// 获取Toast图标
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check-circle-fill';
        case 'error': return 'exclamation-triangle-fill';
        case 'warning': return 'exclamation-triangle-fill';
        default: return 'info-circle-fill';
    }
}

// 获取客户类型文本
function getCustomerTypeText(type) {
    switch (type) {
        case 'direct': return '直接客户';
        case 'global': return '全球客户';
        case 'overseas': return '海外代理';
        case 'peer': return '同行客户';
        default: return type;
    }
}

// 获取等级颜色
function getGradeColor(grade) {
    switch (grade) {
        case 'A+': return 'success';
        case 'A': return 'primary';
        case 'B': return 'warning';
        case 'C': return 'danger';
        case 'D': return 'dark';
        default: return 'secondary';
    }
} 
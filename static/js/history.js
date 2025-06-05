// 全局变量
let currentPage = 1;
let totalPages = 1;
let allRatings = [];
let currentRatingForAction = null;
let selectedRatings = new Set(); // 存储选中的评级ID

// 等待Bootstrap加载的辅助函数
function waitForBootstrap() {
    return new Promise((resolve) => {
        if (typeof bootstrap !== 'undefined') {
            resolve();
        } else {
            const checkBootstrap = () => {
                if (typeof bootstrap !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkBootstrap, 100);
                }
            };
            checkBootstrap();
        }
    });
}

// 安全的模态框显示函数
async function showModal(modalId) {
    try {
        await waitForBootstrap();
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        return modal;
    } catch (error) {
        console.error('Error showing modal:', error);
        showToast('模态框显示失败', 'error');
        return null;
    }
}

// 安全的模态框隐藏函数
async function hideModal(modalId) {
    try {
        await waitForBootstrap();
        const modalElement = document.getElementById(modalId);
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    } catch (error) {
        console.error('Error hiding modal:', error);
    }
}

// 安全的Toast显示函数
async function showBootstrapToast(toastId) {
    try {
        await waitForBootstrap();
        const toast = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 确保Bootstrap加载后再初始化
    waitForBootstrap().then(() => {
        loadHistory();
        loadStatistics(); // 加载统计信息
    });
});

// 刷新历史记录
function refreshHistory() {
    selectedRatings.clear();
    updateSelectedCount();
    loadHistory();
}

// 加载历史记录
async function loadHistory(page = 1) {
    try {
        showLoadingIndicator();
        
        const response = await fetch(`/api/history?page=${page}&per_page=10`);
        const result = await response.json();
        
        if (result.success) {
            allRatings = result.data.ratings;
            currentPage = result.data.current_page;
            totalPages = result.data.pages;
            
            hideLoadingIndicator();
            
            if (allRatings.length === 0) {
                showNoRecords();
            } else {
                renderHistoryTable(allRatings);
                renderPagination();
                showHistoryTable();
            }
            
            // 更新选中状态
            updateSelectedCount();
        } else {
            throw new Error(result.error || '加载历史记录失败');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        hideLoadingIndicator();
        showToast('加载历史记录失败: ' + error.message, 'error');
    }
}

// 显示加载指示器
function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('historyTable').style.display = 'none';
    document.getElementById('noRecords').style.display = 'none';
    document.getElementById('paginationNav').style.display = 'none';
    // 统计面板始终显示
    document.getElementById('statsSection').style.display = 'block';
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

// 显示历史记录表格
function showHistoryTable() {
    document.getElementById('historyTable').style.display = 'block';
    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('exportAllBtn').disabled = false;
}

// 显示无记录提示
function showNoRecords() {
    document.getElementById('noRecords').style.display = 'block';
    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('exportAllBtn').disabled = true;
    document.getElementById('exportSelectedBtn').disabled = true;
}

// 加载统计信息
async function loadStatistics(timeRange = '1month', startDate = null, endDate = null) {
    try {
        let url = `/api/statistics?time_range=${timeRange}`;
        if (timeRange === 'custom' && startDate && endDate) {
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            updateStatistics(result.data);
        } else {
            console.error('Failed to load statistics:', result.error);
            showToast('加载统计信息失败', 'error');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('加载统计信息失败: ' + error.message, 'error');
    }
}

// 更新统计信息
function updateStatistics(data) {
    document.getElementById('totalCount').textContent = data.total || 0;
    document.getElementById('aplusCount').textContent = data.aplus_count || 0;
    document.getElementById('aCount').textContent = data.a_count || 0;
    document.getElementById('bcCount').textContent = (data.b_count || 0) + (data.c_count || 0);
    document.getElementById('dCount').textContent = data.d_count || 0;
    
    // 更新时间范围描述
    const timeRangeInfo = document.getElementById('timeRangeInfo');
    if (timeRangeInfo) {
        timeRangeInfo.textContent = `统计时间：${data.time_description || '近一个月'}`;
    }
}

// 时间范围改变时更新统计
function updateStatsByTimeRange() {
    const timeRange = document.getElementById('timeRangeSelect').value;
    const customTimeRange = document.getElementById('customTimeRange');
    
    if (timeRange === 'custom') {
        customTimeRange.style.display = 'block';
        // 设置默认日期
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    } else {
        customTimeRange.style.display = 'none';
        loadStatistics(timeRange);
    }
}

// 应用自定义时间范围
function applyCustomTimeRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showToast('请选择开始日期和结束日期', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('开始日期不能晚于结束日期', 'warning');
        return;
    }
    
    loadStatistics('custom', startDate, endDate);
}

// 渲染历史记录表格
function renderHistoryTable(ratings) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    ratings.forEach((rating, index) => {
        const row = document.createElement('tr');
        const startIndex = (currentPage - 1) * 10;
        const isChecked = selectedRatings.has(rating.id);
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="form-check-input rating-checkbox" 
                       data-rating-id="${rating.id}" 
                       ${isChecked ? 'checked' : ''} 
                       onchange="toggleRatingSelection(${rating.id})">
            </td>
            <td class="fw-bold">${startIndex + index + 1}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="rating-grade-badge badge bg-${getGradeBadgeClass(rating.grade)} me-2">
                        ${rating.grade}
                    </div>
                    <div>
                        <div class="fw-semibold">${rating.customer_name}</div>
                        <small class="text-muted">${getCustomerTypeText(rating.customer_type)}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-secondary">${getCustomerTypeText(rating.customer_type)}</span>
            </td>
            <td>
                <div>
                    <div class="fw-semibold">${rating.submitter_name || '未填写'}</div>
                    <small class="text-muted">${rating.submitter_department || '未填写'}</small>
                </div>
            </td>
            <td>
                <div class="score-display-inline">
                    <span class="fw-bold fs-5 text-${getScoreColor(rating.total_score)}">${rating.total_score}</span>
                    <small class="text-muted ms-1">/ 100 分</small>
                </div>
            </td>
            <td>
                <span class="badge bg-${getGradeBadgeClass(rating.grade)} fs-6 px-3 py-2">
                    ${rating.grade} 级
                </span>
            </td>
            <td>
                <div class="text-muted">
                    <i class="bi bi-calendar3 me-1"></i>
                    ${formatDateTime(rating.created_at)}
                </div>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewDetail(${rating.id})" title="查看详情">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success btn-sm" onclick="exportRatingReport(${rating.id})" title="导出报告">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteRating(${rating.id})" title="删除记录">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // 更新全选按钮状态
    updateSelectAllCheckbox();
}

// 切换全选
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const ratingCheckboxes = document.querySelectorAll('.rating-checkbox');
    
    if (selectAllCheckbox.checked) {
        // 全选当前页面的所有记录
        ratingCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            const ratingId = parseInt(checkbox.dataset.ratingId);
            selectedRatings.add(ratingId);
        });
    } else {
        // 取消选择当前页面的所有记录
        ratingCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            const ratingId = parseInt(checkbox.dataset.ratingId);
            selectedRatings.delete(ratingId);
        });
    }
    
    updateSelectedCount();
}

// 切换单个记录选择
function toggleRatingSelection(ratingId) {
    if (selectedRatings.has(ratingId)) {
        selectedRatings.delete(ratingId);
    } else {
        selectedRatings.add(ratingId);
    }
    
    updateSelectedCount();
    updateSelectAllCheckbox();
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const ratingCheckboxes = document.querySelectorAll('.rating-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.rating-checkbox:checked');
    
    if (ratingCheckboxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedCheckboxes.length === ratingCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else if (checkedCheckboxes.length > 0) {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
    } else {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    }
}

// 更新选中计数
function updateSelectedCount() {
    const count = selectedRatings.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('exportSelectedBtn').disabled = count === 0;
}

// 导出选中的记录
async function exportSelectedRecords() {
    try {
        if (selectedRatings.size === 0) {
            showToast('请先选择要导出的记录', 'warning');
            return;
        }
        
        showToast(`正在导出 ${selectedRatings.size} 个选中记录...`, 'info');
        
        const selectedArray = Array.from(selectedRatings);
        for (let i = 0; i < selectedArray.length; i++) {
            await exportRatingReport(selectedArray[i]);
            // 添加延迟避免过快请求
            if (i < selectedArray.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        showToast(`成功导出 ${selectedRatings.size} 个选中记录！`, 'success');
    } catch (error) {
        console.error('Error exporting selected reports:', error);
        showToast('导出选中记录失败: ' + error.message, 'error');
    }
}

// 渲染分页
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        document.getElementById('paginationNav').style.display = 'none';
        return;
    }
    
    document.getElementById('paginationNav').style.display = 'block';
    
    // 上一页
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `
        <a class="page-link" href="#" onclick="loadHistory(${currentPage - 1})">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    pagination.appendChild(prevItem);
    
    // 页码
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        const firstItem = document.createElement('li');
        firstItem.className = 'page-item';
        firstItem.innerHTML = `<a class="page-link" href="#" onclick="loadHistory(1)">1</a>`;
        pagination.appendChild(firstItem);
        
        if (startPage > 2) {
            const dotsItem = document.createElement('li');
            dotsItem.className = 'page-item disabled';
            dotsItem.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(dotsItem);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#" onclick="loadHistory(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dotsItem = document.createElement('li');
            dotsItem.className = 'page-item disabled';
            dotsItem.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(dotsItem);
        }
        
        const lastItem = document.createElement('li');
        lastItem.className = 'page-item';
        lastItem.innerHTML = `<a class="page-link" href="#" onclick="loadHistory(${totalPages})">${totalPages}</a>`;
        pagination.appendChild(lastItem);
    }
    
    // 下一页
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `
        <a class="page-link" href="#" onclick="loadHistory(${currentPage + 1})">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    pagination.appendChild(nextItem);
}

// 查看详情
async function viewDetail(ratingId) {
    try {
        const response = await fetch(`/api/rating/${ratingId}`);
        const result = await response.json();
        
        if (result.success) {
            currentRatingForAction = result.data;
            renderDetailModal(result.data);
            await showModal('detailModal');
        } else {
            throw new Error(result.error || '获取详情失败');
        }
    } catch (error) {
        console.error('Error loading detail:', error);
        showToast('获取详情失败: ' + error.message, 'error');
    }
}

// 渲染详情模态框内容 - 完整的评估报告格式
function renderDetailModal(rating) {
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <!-- 报告标题 -->
        <div class="text-center mb-4">
            <h3 class="fw-bold text-primary">客户售前等级评分报告</h3>
            <p class="text-muted">Customer Rating Report</p>
        </div>
        
        <!-- 基本信息卡片 -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="bi bi-person-badge me-2"></i>客户基本信息</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6">
                                <strong>客户名称：</strong><br>
                                <span class="fs-5 fw-semibold text-primary">${rating.customer_name}</span>
                            </div>
                            <div class="col-6">
                                <strong>客户类型：</strong><br>
                                <span class="badge bg-secondary fs-6 px-3 py-2">${getCustomerTypeText(rating.customer_type)}</span>
                            </div>
                            <div class="col-6">
                                <strong>提交人：</strong><br>
                                <span class="text-muted">${rating.submitter_name || '未填写'}</span>
                            </div>
                            <div class="col-6">
                                <strong>部门：</strong><br>
                                <span class="text-muted">${rating.submitter_department || '未填写'}</span>
                            </div>
                            <div class="col-6">
                                <strong>评估日期：</strong><br>
                                <span class="text-muted">${formatDateTime(rating.created_at)}</span>
                            </div>
                            <div class="col-6">
                                <strong>记录编号：</strong><br>
                                <span class="text-muted">#${rating.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-award me-2"></i>评级结果</h6>
                    </div>
                    <div class="card-body text-center">
                        <div class="rating-display">
                            <div class="display-4 fw-bold text-${getScoreColor(rating.total_score)} mb-2">
                                ${rating.total_score}
                            </div>
                            <div class="fs-6 text-muted mb-2">综合得分</div>
                            <div class="badge bg-${getGradeBadgeClass(rating.grade)} fs-5 px-4 py-2">
                                ${rating.grade} 级
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 评估结论 -->
        <div class="alert alert-${getAlertClass(rating.grade)} border-0 mb-4">
            <h6 class="alert-heading">
                <i class="bi bi-lightbulb me-2"></i>评估结论
            </h6>
            <p class="mb-0 fw-semibold">${getRatingConclusion(rating)}</p>
        </div>
        
        <!-- 详细评分表格 -->
        <div class="card">
            <div class="card-header bg-light">
                <h6 class="mb-0"><i class="bi bi-list-check me-2"></i>评估明细</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-primary">
                            <tr>
                                <th>评估类别</th>
                                <th>评估指标</th>
                                <th>得分</th>
                                <th>权重</th>
                                <th>最终得分</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateDetailedScoreTable(rating)}
                        </tbody>
                        <tfoot class="table-dark">
                            <tr>
                                <th colspan="3">总计</th>
                                <th>100%</th>
                                <th class="fw-bold">${rating.total_score} 分</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- 评级标准说明 -->
        <div class="card mt-4">
            <div class="card-header bg-info text-white">
                <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>评级标准说明</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <div class="badge bg-success fs-6 px-3 py-2 mb-2">A+ 级</div>
                            <div class="text-muted">≥ 90 分</div>
                            <small class="text-success">优质客户，推荐优先合作</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <div class="badge bg-primary fs-6 px-3 py-2 mb-2">A 级</div>
                            <div class="text-muted">80-89 分</div>
                            <small class="text-primary">80-89分</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <div class="badge bg-warning fs-6 px-3 py-2 mb-2">B 级</div>
                            <div class="text-muted">70-79 分</div>
                            <small class="text-warning">70-79分</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-3 border rounded">
                            <div class="badge bg-danger fs-6 px-3 py-2 mb-2">C 级</div>
                            <div class="text-muted">< 70 分</div>
                            <small class="text-danger">60-69分</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 生成详细评分表格 - 包含具体指标说明
function generateDetailedScoreTable(rating) {
    const details = [
        {
            category: '行业',
            indicator: getIndustryIndicator(rating.industry_score),
            score: rating.industry_score,
            weight: 10,
            finalScore: rating.industry_score
        },
        {
            category: '业务类型',
            indicator: getBusinessTypeIndicator(rating.business_type_score),
            score: rating.business_type_score,
            weight: 15,
            finalScore: rating.business_type_score
        },
        {
            category: '客户影响力',
            indicator: getInfluenceIndicator(rating.influence_score),
            score: rating.influence_score,
            weight: 10,
            finalScore: rating.influence_score
        },
        {
            category: '客户类型',
            indicator: getCustomerTypeIndicator(rating.customer_type),
            score: rating.customer_type_score,
            weight: 10,
            finalScore: rating.customer_type_score
        },
        {
            category: '客户规模',
            indicator: getLogisticsScaleIndicator(rating.logistics_scale_score),
            score: rating.logistics_scale_score,
            weight: 10,
            finalScore: rating.logistics_scale_score
        },
        {
            category: '资信评价',
            indicator: getCreditScoreIndicator(rating.credit_score),
            score: rating.credit_score,
            weight: 25,
            finalScore: rating.credit_score
        },
        {
            category: '商机预估',
            indicator: getProfitEstimateIndicator(rating.profit_estimate_score),
            score: rating.profit_estimate_score,
            weight: 20,
            finalScore: rating.profit_estimate_score
        }
    ];
    
    return details.map(detail => `
        <tr>
            <td class="fw-semibold">${detail.category}</td>
            <td class="text-muted">${detail.indicator}</td>
            <td><span class="badge bg-primary">${detail.score}分</span></td>
            <td>${detail.weight}%</td>
            <td class="fw-bold text-${getScoreColor(detail.finalScore)}">${detail.finalScore}分</td>
        </tr>
    `).join('');
}

// 获取行业指标说明
function getIndustryIndicator(score) {
    switch(score) {
        case 10: return "战略行业 10分\n电子科技/半导体/汽车及配件/电池储能/电商";
        case 5: return "非战略行业 5分\n除战略行业之外的其他行业";
        default: return "未知行业";
    }
}

// 获取业务类型指标说明
function getBusinessTypeIndicator(score) {
    switch(score) {
        case 15: return "组合型业务 15分\n多类型物流业务组合";
        case 12: return "非组合型业务 12分\n单一物流或相关业务";
        default: return "未知业务类型";
    }
}

// 获取客户影响力指标说明
function getInfluenceIndicator(score) {
    switch(score) {
        case 10: return "世界500强 /中国500强 /上市公司 /国企央企 10分";
        case 8: return "民企500强 8分";
        case 4: return "其他 4分";
        default: return "未知影响力";
    }
}

// 获取客户类型指标说明
function getCustomerTypeIndicator(type) {
    switch(type) {
        case 'direct': return "直接客户";
        case 'global': return "Global同行客户";
        case 'overseas': return "海外代理客户";
        case 'peer': return "同行客户";
        default: return "未知类型";
    }
}

// 获取物流规模指标说明
function getLogisticsScaleIndicator(score) {
    switch(score) {
        case 10: return "≥1亿 10分";
        case 8: return "5000万-1亿 8分";
        case 6: return "1000万-5000万 6分";
        case 4: return "<1000万 4分";
        default: return "未知规模";
    }
}

// 获取资信评价指标说明
function getCreditScoreIndicator(score) {
    switch(score) {
        case 25: return "优秀【90-100】 (25分)";
        case 20: return "良好【80-89】 (20分)";
        case 15: return "一般【65-79】 (15分)";
        case 5: return "较差【<65】 (5分)";
        default: return "未知资信";
    }
}

// 获取商机预估指标说明
function getProfitEstimateIndicator(score) {
    switch(score) {
        case 20: return "≥1亿营收或≥500万毛利 20分";
        case 10: return "≥100万毛利 10分";
        case 5: return "≥60万毛利 5分";
        case 2: return "≥12万毛利 2分";
        case 0: return "<12万毛利 0分";
        default: return "未知商机";
    }
}

// 导出当前查看的记录
function exportCurrentRecord() {
    if (currentRatingForAction) {
        exportRatingReport(currentRatingForAction.id);
    }
}

// 导出评级报告
async function exportRatingReport(ratingId) {
    try {
        showToast('正在生成Excel报告...', 'info');
        
        const response = await fetch(`/api/rating/${ratingId}/export`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // 从响应头获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `客户评级报告_${new Date().getTime()}.xlsx`;
            if (contentDisposition) {
                const matches = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/);
                if (matches && matches[1]) {
                    filename = decodeURIComponent(matches[1]);
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast('Excel报告下载成功！', 'success');
        } else {
            throw new Error('导出失败');
        }
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('导出报告失败: ' + error.message, 'error');
    }
}

// 导出所有记录到单个Excel文件
async function exportAllRecords() {
    try {
        if (allRatings.length === 0) {
            showToast('没有可导出的记录', 'warning');
            return;
        }
        
        showToast('正在生成汇总Excel文件，请稍候...', 'info');
        
        const response = await fetch('/api/export/all');
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // 生成文件名
            const now = new Date();
            const dateStr = now.getFullYear() + 
                           String(now.getMonth() + 1).padStart(2, '0') + 
                           String(now.getDate()).padStart(2, '0') + '_' +
                           String(now.getHours()).padStart(2, '0') + 
                           String(now.getMinutes()).padStart(2, '0');
            const filename = `客户评级汇总表_${dateStr}.xlsx`;
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast('汇总Excel文件下载成功！', 'success');
        } else {
            throw new Error('导出失败');
        }
    } catch (error) {
        console.error('Error exporting all records:', error);
        showToast('导出汇总文件失败: ' + error.message, 'error');
    }
}

// 删除评级记录（标记删除）
async function deleteRating(ratingId) {
    try {
        currentRatingForAction = { id: ratingId };
        
        // 清空删除原因输入框
        const deleteReasonInput = document.getElementById('deleteReason');
        if (deleteReasonInput) {
            deleteReasonInput.value = '';
        }
        
        await showModal('deleteModal');
    } catch (error) {
        console.error('Error showing delete modal:', error);
        showToast('显示删除确认框失败', 'error');
    }
}

// 确认删除（软删除，标记为删除状态）
async function confirmDelete() {
    try {
        if (!currentRatingForAction) return;
        
        // 获取删除原因
        const deleteReasonInput = document.getElementById('deleteReason');
        const deleteReason = deleteReasonInput ? deleteReasonInput.value.trim() : '';
        
        if (!deleteReason) {
            showToast('请输入删除原因', 'warning');
            return;
        }
        
        const response = await fetch(`/api/rating/${currentRatingForAction.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: deleteReason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message || '记录已标记删除，等待管理员审批', 'success');
            
            // 从选中列表中移除
            selectedRatings.delete(currentRatingForAction.id);
            updateSelectedCount();
            
            // 关闭模态框
            await hideModal('deleteModal');
            
            // 重新加载当前页面
            loadHistory(currentPage);
        } else {
            throw new Error(result.error || '删除失败');
        }
    } catch (error) {
        console.error('Error deleting rating:', error);
        showToast('删除失败: ' + error.message, 'error');
    }
}

// 获取等级徽章样式类
function getGradeBadgeClass(grade) {
    switch(grade) {
        case 'A+': return 'success';
        case 'A': return 'primary';
        case 'B': return 'warning';
        case 'C': return 'danger';
        case 'D': return 'dark';
        default: return 'secondary';
    }
}

// 获取分数颜色
function getScoreColor(score) {
    if (score > 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    if (score >= 60) return 'danger';
    return 'dark';
}

// 获取提示框样式类
function getAlertClass(grade) {
    switch(grade) {
        case 'A+': return 'success';
        case 'A': return 'primary';
        case 'B': return 'warning';
        case 'C': return 'danger';
        case 'D': return 'dark';
        default: return 'secondary';
    }
}

// 获取客户类型文本
function getCustomerTypeText(type) {
    switch(type) {
        case 'direct': return '直接客户';
        case 'global': return 'Global同行客户';
        case 'overseas': return '海外代理客户';
        case 'peer': return '同行客户';
        default: return '未知类型';
    }
}

// 获取评级结论
function getRatingConclusion(rating) {
    if (rating.customer_type === 'peer') {
        if (rating.total_score >= 60) {
            return '⚠️ 同行客户限制：根据规则，同行客户售前项目等级最高不超过C级';
        } else {
            return '❗ 同行客户评级为D级，不建议合作';
        }
    }
    
    switch(rating.grade) {
        case 'A+':
            return '✅ 该客户评级为A+级，属于优质客户，推荐优先合作';
        case 'A':
            return '📈 该客户评级为A级，建议加强合作';
        case 'B':
            return '⚠️ 该客户评级为B级，有一定的风险，需要谨慎评估';
        case 'C':
            return '❗ 该客户评级为C级，需要领导审批';
        case 'D':
            return '❗ 该客户评级为D级，不建议合作';
        default:
            return '评级信息异常，请重新评估';
    }
}

// 格式化日期时间
function formatDateTime(dateTime) {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
}

// 显示提示消息
async function showToast(message, type = 'info') {
    try {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = toast.querySelector('.bi');
        
        if (toastMessage) {
            toastMessage.textContent = message;
        }
        
        if (toastIcon) {
            toastIcon.className = `bi ${getToastIcon(type)} text-${type} me-2`;
        }
        
        // 使用安全的Bootstrap Toast显示
        await showBootstrapToast('toastNotification');
    } catch (error) {
        console.error('Error showing toast:', error);
        // 如果Toast显示失败，使用浏览器原生alert作为后备方案
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// 获取提示图标
function getToastIcon(type) {
    switch(type) {
        case 'success': return 'bi-check-circle';
        case 'error': return 'bi-exclamation-triangle';
        case 'warning': return 'bi-exclamation-circle';
        default: return 'bi-info-circle';
    }
} 
from flask import Flask, render_template, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import os
import xlsxwriter
import io
from external_data_service import ExternalDataService
from company_autocomplete_service import autocomplete_service

app = Flask(__name__)

# 数据库配置
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "customer_rating.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'customer-rating-system-2024'

db = SQLAlchemy(app)

# 数据模型
class CustomerRating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(200), nullable=False)
    customer_type = db.Column(db.String(50), nullable=False)
    industry_score = db.Column(db.Integer, nullable=False)
    business_type_score = db.Column(db.Integer, nullable=False)
    influence_score = db.Column(db.Integer, nullable=False)
    customer_type_score = db.Column(db.Integer, nullable=False)
    logistics_scale_score = db.Column(db.Integer, nullable=False)
    credit_score = db.Column(db.Integer, nullable=False)
    profit_estimate_score = db.Column(db.Integer, nullable=False)
    total_score = db.Column(db.Integer, nullable=False)
    grade = db.Column(db.String(10), nullable=False)
    rating_details = db.Column(db.Text)  # JSON存储详细评分信息
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_type': self.customer_type,
            'industry_score': self.industry_score,
            'business_type_score': self.business_type_score,
            'influence_score': self.influence_score,
            'customer_type_score': self.customer_type_score,
            'logistics_scale_score': self.logistics_scale_score,
            'credit_score': self.credit_score,
            'profit_estimate_score': self.profit_estimate_score,
            'total_score': self.total_score,
            'grade': self.grade,
            'rating_details': json.loads(self.rating_details) if self.rating_details else {},
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

# 创建数据库表
with app.app_context():
    db.create_all()

# 初始化外部数据服务
external_service = ExternalDataService()

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')

@app.route('/test-autocomplete')
def test_autocomplete():
    """自动补全测试页面"""
    return send_file('test_autocomplete.html')

@app.route('/api/calculate', methods=['POST'])
def calculate_rating():
    """计算客户评级"""
    try:
        data = request.json
        
        # 获取评分数据
        customer_name = data.get('customer_name', '')
        customer_type = data.get('customer_type', '')
        industry_score = int(data.get('industry_score', 0))
        business_type_score = int(data.get('business_type_score', 0))
        influence_score = int(data.get('influence_score', 0))
        logistics_scale_score = int(data.get('logistics_scale_score', 0))
        credit_score = int(data.get('credit_score', 0))
        profit_estimate_score = int(data.get('profit_estimate_score', 0))
        
        # 客户类型评分
        customer_type_mapping = {
            'direct': 10,
            'global': 8,
            'overseas': 6,
            'peer': 0
        }
        customer_type_score = customer_type_mapping.get(customer_type, 0)
        
        # 计算总分
        total_score = (industry_score + business_type_score + influence_score + 
                      customer_type_score + logistics_scale_score + 
                      credit_score + profit_estimate_score)
        
        # 确定等级
        if customer_type == 'peer':
            grade = 'C'
            message = '⚠️ 同行客户限制：根据规则，同行客户等级最高不超过C级'
            alert_class = 'warning'
        else:
            if total_score >= 90:
                grade = 'A+'
                message = '✅ 该客户评级为A+级，属于优质客户，推荐优先合作'
                alert_class = 'success'
            elif total_score >= 80:
                grade = 'A'
                message = '📈 该客户评级为A级，属于良好客户，建议加强合作'
                alert_class = 'success'
            elif total_score >= 70:
                grade = 'B'
                message = '⚠️ 该客户评级为B级，有一定的风险，需要谨慎评估'
                alert_class = 'warning'
            else:
                grade = 'C'
                message = '❗ 该客户评级为C级，高风险客户，需要领导审批'
                alert_class = 'danger'
        
        # 保存到数据库
        rating_details = {
            'industry_detail': data.get('industry_detail', ''),
            'business_type_detail': data.get('business_type_detail', ''),
            'influence_detail': data.get('influence_detail', ''),
            'logistics_scale_detail': data.get('logistics_scale_detail', ''),
            'profit_estimate_detail': data.get('profit_estimate_detail', ''),
            'credit_details': data.get('credit_details', {})
        }
        
        new_rating = CustomerRating(
            customer_name=customer_name,
            customer_type=customer_type,
            industry_score=industry_score,
            business_type_score=business_type_score,
            influence_score=influence_score,
            customer_type_score=customer_type_score,
            logistics_scale_score=logistics_scale_score,
            credit_score=credit_score,
            profit_estimate_score=profit_estimate_score,
            total_score=total_score,
            grade=grade,
            rating_details=json.dumps(rating_details, ensure_ascii=False)
        )
        
        db.session.add(new_rating)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': new_rating.id,
                'customer_name': customer_name,
                'customer_type': customer_type,
                'industry_score': industry_score,
                'business_type_score': business_type_score,
                'influence_score': influence_score,
                'customer_type_score': customer_type_score,
                'logistics_scale_score': logistics_scale_score,
                'credit_score': credit_score,
                'profit_estimate_score': profit_estimate_score,
                'total_score': total_score,
                'grade': grade,
                'message': message,
                'alert_class': alert_class
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/history', methods=['GET'])
def get_rating_history():
    """获取评级历史记录"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        ratings = CustomerRating.query.order_by(CustomerRating.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'ratings': [rating.to_dict() for rating in ratings.items],
                'total': ratings.total,
                'pages': ratings.pages,
                'current_page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/rating/<int:rating_id>', methods=['GET'])
def get_rating_detail(rating_id):
    """获取评级详情"""
    try:
        rating = CustomerRating.query.get_or_404(rating_id)
        return jsonify({
            'success': True,
            'data': rating.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/rating/<int:rating_id>', methods=['DELETE'])
def delete_rating(rating_id):
    """删除评级记录"""
    try:
        rating = CustomerRating.query.get_or_404(rating_id)
        db.session.delete(rating)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '评级记录已删除'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/history')
def history_page():
    """历史记录页面"""
    return render_template('history.html')

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """获取统计信息"""
    try:
        # 获取时间筛选参数
        time_range = request.args.get('time_range', '1month')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # 构建查询条件
        query = CustomerRating.query
        
        if time_range == 'custom' and start_date and end_date:
            # 自定义时间范围
            start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
            end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(CustomerRating.created_at >= start_datetime)
            query = query.filter(CustomerRating.created_at < end_datetime)
        elif time_range != 'all':
            # 预设时间范围
            now = datetime.now()
            if time_range == '1month':
                start_datetime = now - timedelta(days=30)
            elif time_range == '3months':
                start_datetime = now - timedelta(days=90)
            elif time_range == '6months':
                start_datetime = now - timedelta(days=180)
            elif time_range == '1year':
                start_datetime = now - timedelta(days=365)
            else:
                start_datetime = None
                
            if start_datetime:
                query = query.filter(CustomerRating.created_at >= start_datetime)
        
        # 获取筛选后的记录
        ratings = query.all()
        
        # 计算统计信息
        total_count = len(ratings)
        aplus_count = len([r for r in ratings if r.grade == 'A+'])
        a_count = len([r for r in ratings if r.grade == 'A'])
        b_count = len([r for r in ratings if r.grade == 'B'])
        c_count = len([r for r in ratings if r.grade == 'C'])
        
        # 计算时间范围描述
        if time_range == 'custom' and start_date and end_date:
            time_desc = f"{start_date} 至 {end_date}"
        elif time_range == '1month':
            time_desc = "近一个月"
        elif time_range == '3months':
            time_desc = "近三个月"
        elif time_range == '6months':
            time_desc = "近半年"
        elif time_range == '1year':
            time_desc = "近一年"
        else:
            time_desc = "全部时间"
        
        return jsonify({
            'success': True,
            'data': {
                'total': total_count,
                'aplus_count': aplus_count,
                'a_count': a_count,
                'b_count': b_count,
                'c_count': c_count,
                'time_range': time_range,
                'time_description': time_desc,
                'start_date': start_date,
                'end_date': end_date
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/rating/<int:rating_id>/export', methods=['GET'])
def export_rating_report(rating_id):
    """导出客户评级报告为Excel"""
    try:
        rating = CustomerRating.query.get_or_404(rating_id)
        
        # 创建内存中的Excel文件
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('评级报告')
        
        # 定义格式
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'align': 'center',
            'valign': 'vcenter',
            'font_color': '#1a2980'
        })
        
        header_format = workbook.add_format({
            'bold': True,
            'font_size': 12,
            'bg_color': '#3498db',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        label_format = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'align': 'right',
            'valign': 'vcenter'
        })
        
        value_format = workbook.add_format({
            'font_size': 11,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        score_format = workbook.add_format({
            'font_size': 11,
            'align': 'center',
            'valign': 'vcenter',
            'bold': True,
            'font_color': '#3498db'
        })
        
        total_format = workbook.add_format({
            'bold': True,
            'font_size': 14,
            'bg_color': '#e3f2fd',
            'font_color': '#1a2980',
            'align': 'center',
            'valign': 'vcenter',
            'border': 2
        })
        
        # 设置列宽
        worksheet.set_column('A:A', 15)
        worksheet.set_column('B:B', 30)
        worksheet.set_column('C:C', 12)
        worksheet.set_column('D:D', 12)
        worksheet.set_column('E:E', 15)
        
        # 标题
        worksheet.merge_range('A1:E1', '售前项目客户评级报告', title_format)
        worksheet.set_row(0, 25)
        
        # 基本信息
        row = 2
        worksheet.write(row, 0, '客户名称', label_format)
        worksheet.write(row, 1, rating.customer_name, value_format)
        worksheet.write(row, 3, '客户类型', label_format)
        worksheet.write(row, 4, get_customer_type_text(rating.customer_type), value_format)
        
        row += 1
        worksheet.write(row, 0, '评估日期', label_format)
        worksheet.write(row, 1, rating.created_at.strftime('%Y年%m月%d日 %H:%M'), value_format)
        
        row += 1
        worksheet.write(row, 0, '综合得分', label_format)
        worksheet.write(row, 1, f'{rating.total_score}分', score_format)
        worksheet.write(row, 3, '客户等级', label_format)
        worksheet.write(row, 4, rating.grade, score_format)
        
        row += 1
        worksheet.write(row, 0, '评估结论', label_format)
        conclusion = get_rating_conclusion(rating.grade, rating.customer_type, rating.total_score)
        worksheet.write(row, 1, conclusion, value_format)
        
        # 空行
        row += 2
        
        # 评估明细标题
        worksheet.merge_range(f'A{row+1}:E{row+1}', '评估明细', header_format)
        worksheet.set_row(row, 20)
        
        row += 1
        # 明细表头
        headers = ['评估类别', '评估指标', '得分', '权重', '说明']
        for col, header in enumerate(headers):
            worksheet.write(row, col, header, header_format)
        worksheet.set_row(row, 18)
        
        # 明细数据
        details = [
            ('行业评分', get_industry_text(rating.industry_score), f'{rating.industry_score}分', '10%', '战略行业优先'),
            ('业务类型评分', get_business_type_text(rating.business_type_score), f'{rating.business_type_score}分', '15%', '组合业务更优'),
            ('客户影响力评分', get_influence_text(rating.influence_score), f'{rating.influence_score}分', '10%', '知名企业加分'),
            ('客户类型评分', get_customer_type_text(rating.customer_type), f'{rating.customer_type_score}分', '10%', '客户类型系数'),
            ('客户规模评分', get_logistics_scale_text(rating.logistics_scale_score), f'{rating.logistics_scale_score}分', '10%', '规模越大越优'),
            ('资信评估评分', get_credit_text(rating.credit_score), f'{rating.credit_score}分', '25%', '信用状况评估'),
            ('商机预估评分', get_profit_text(rating.profit_estimate_score), f'{rating.profit_estimate_score}分', '20%', '预期收益评估')
        ]
        
        for detail in details:
            row += 1
            for col, value in enumerate(detail):
                if col == 2:  # 得分列
                    worksheet.write(row, col, value, score_format)
                else:
                    worksheet.write(row, col, value, value_format)
        
        # 总分行
        row += 1
        worksheet.write(row, 0, '总分', total_format)
        worksheet.write(row, 1, '综合评估结果', total_format)
        worksheet.write(row, 2, f'{rating.total_score}分', total_format)
        worksheet.write(row, 3, '100%', total_format)
        worksheet.write(row, 4, f'{rating.grade}级客户', total_format)
        worksheet.set_row(row, 25)
        
        # 评级说明
        row += 2
        worksheet.write(row, 0, '评级说明', label_format)
        worksheet.write(row, 1, 'A+级(≥90分):优质客户，优先合作', value_format)
        row += 1
        worksheet.write(row, 1, 'A级(80-89分):良好客户，建议加强合作', value_format)
        row += 1
        worksheet.write(row, 1, 'B级(70-79分):一般客户，需谨慎评估', value_format)
        row += 1
        worksheet.write(row, 1, 'C级(<70分):高风险客户，需领导审批', value_format)
        
        # 页脚
        row += 2
        worksheet.write(row, 0, '系统生成时间', label_format)
        worksheet.write(row, 1, datetime.now().strftime('%Y年%m月%d日 %H:%M:%S'), value_format)
        
        workbook.close()
        output.seek(0)
        
        # 生成文件名
        filename = f'客户评级报告_{rating.customer_name}_{rating.created_at.strftime("%Y%m%d_%H%M")}.xlsx'
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/export/all', methods=['GET'])
def export_all_ratings():
    """导出所有客户评级记录到单个Excel文件"""
    try:
        # 获取所有评级记录
        ratings = CustomerRating.query.order_by(CustomerRating.created_at.desc()).all()
        
        if not ratings:
            return jsonify({
                'success': False,
                'error': '没有找到评级记录'
            }), 404
        
        # 创建内存中的Excel文件
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('客户评级汇总')
        
        # 定义格式
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'align': 'center',
            'valign': 'vcenter',
            'font_color': '#1a2980'
        })
        
        header_format = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'bg_color': '#3498db',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        cell_format = workbook.add_format({
            'font_size': 10,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        score_format = workbook.add_format({
            'font_size': 10,
            'align': 'center',
            'valign': 'vcenter',
            'bold': True,
            'font_color': '#3498db',
            'border': 1
        })
        
        # 设置列宽
        worksheet.set_column('A:A', 8)   # 序号
        worksheet.set_column('B:B', 20)  # 客户名称
        worksheet.set_column('C:C', 15)  # 客户类型
        worksheet.set_column('D:D', 10)  # 综合得分
        worksheet.set_column('E:E', 8)   # 客户等级
        worksheet.set_column('F:F', 8)   # 行业
        worksheet.set_column('G:G', 8)   # 业务类型
        worksheet.set_column('H:H', 8)   # 影响力
        worksheet.set_column('I:I', 8)   # 规模
        worksheet.set_column('J:J', 8)   # 资信
        worksheet.set_column('K:K', 8)   # 商机
        worksheet.set_column('L:L', 18)  # 评估时间
        
        # 标题
        worksheet.merge_range('A1:L1', '客户评级汇总表', title_format)
        worksheet.set_row(0, 25)
        
        # 表头
        headers = [
            '序号', '客户名称', '客户类型', '综合得分', '客户等级',
            '行业评分', '业务类型', '影响力', '规模评分', '资信评分', '商机评分', '评估时间'
        ]
        
        row = 2
        for col, header in enumerate(headers):
            worksheet.write(row, col, header, header_format)
        worksheet.set_row(row, 20)
        
        # 数据行
        for index, rating in enumerate(ratings):
            row += 1
            
            # 序号
            worksheet.write(row, 0, index + 1, cell_format)
            
            # 客户名称
            worksheet.write(row, 1, rating.customer_name, cell_format)
            
            # 客户类型
            worksheet.write(row, 2, get_customer_type_text(rating.customer_type), cell_format)
            
            # 综合得分
            worksheet.write(row, 3, f'{rating.total_score}分', score_format)
            
            # 客户等级
            grade_format = workbook.add_format({
                'font_size': 10,
                'align': 'center',
                'valign': 'vcenter',
                'bold': True,
                'border': 1,
                'font_color': get_grade_color(rating.grade)
            })
            worksheet.write(row, 4, rating.grade, grade_format)
            
            # 各项评分
            worksheet.write(row, 5, rating.industry_score, cell_format)
            worksheet.write(row, 6, rating.business_type_score, cell_format)
            worksheet.write(row, 7, rating.influence_score, cell_format)
            worksheet.write(row, 8, rating.logistics_scale_score, cell_format)
            worksheet.write(row, 9, rating.credit_score, cell_format)
            worksheet.write(row, 10, rating.profit_estimate_score, cell_format)
            
            # 评估时间
            worksheet.write(row, 11, rating.created_at.strftime('%Y-%m-%d %H:%M'), cell_format)
        
        # 统计信息
        row += 2
        worksheet.write(row, 0, '统计信息', header_format)
        
        # 计算统计
        total_count = len(ratings)
        aplus_count = len([r for r in ratings if r.grade == 'A+'])
        a_count = len([r for r in ratings if r.grade == 'A'])
        b_count = len([r for r in ratings if r.grade == 'B'])
        c_count = len([r for r in ratings if r.grade == 'C'])
        
        row += 1
        worksheet.write(row, 0, '总记录数', cell_format)
        worksheet.write(row, 1, total_count, cell_format)
        worksheet.write(row, 2, 'A+级客户', cell_format)
        worksheet.write(row, 3, aplus_count, cell_format)
        worksheet.write(row, 4, 'A级客户', cell_format)
        worksheet.write(row, 5, a_count, cell_format)
        worksheet.write(row, 6, 'B级客户', cell_format)
        worksheet.write(row, 7, b_count, cell_format)
        worksheet.write(row, 8, 'C级客户', cell_format)
        worksheet.write(row, 9, c_count, cell_format)
        
        # 页脚
        row += 2
        worksheet.write(row, 0, '生成时间', cell_format)
        worksheet.write(row, 1, datetime.now().strftime('%Y年%m月%d日 %H:%M:%S'), cell_format)
        
        workbook.close()
        output.seek(0)
        
        # 生成文件名
        now = datetime.now()
        filename = f'客户评级汇总表_{now.strftime("%Y%m%d_%H%M")}.xlsx'
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def get_grade_color(grade):
    """获取等级对应的颜色"""
    colors = {
        'A+': '#27ae60',  # 绿色
        'A': '#3498db',   # 蓝色
        'B': '#f39c12',   # 橙色
        'C': '#e74c3c'    # 红色
    }
    return colors.get(grade, '#000000')

# 辅助函数
def get_customer_type_text(customer_type):
    types = {
        'direct': '直接客户',
        'global': 'Global同行客户',
        'overseas': '海外代理客户',
        'peer': '同行客户'
    }
    return types.get(customer_type, customer_type)

def get_rating_conclusion(grade, customer_type, total_score):
    if customer_type == 'peer':
        return '⚠️ 同行客户限制：根据规则，同行客户等级最高不超过C级'
    elif grade == 'A+':
        return '✅ 该客户评级为A+级，属于优质客户，推荐优先合作'
    elif grade == 'A':
        return '📈 该客户评级为A级，属于良好客户，建议加强合作'
    elif grade == 'B':
        return '⚠️ 该客户评级为B级，有一定的风险，需要谨慎评估'
    else:
        return '❗ 该客户评级为C级，高风险客户，需要领导审批'

def get_industry_text(score):
    return '战略行业' if score == 10 else '非战略行业'

def get_business_type_text(score):
    return '组合型业务' if score == 15 else '非组合型业务'

def get_influence_text(score):
    if score == 10:
        return '世界500强/中国500强/上市公司/国企央企'
    elif score == 8:
        return '民企500强'
    else:
        return '其他企业'

def get_logistics_scale_text(score):
    if score == 10:
        return '≥1亿元'
    elif score == 8:
        return '5000万-1亿元'
    elif score == 6:
        return '1000万-5000万元'
    else:
        return '<1000万元'

def get_credit_text(score):
    if score == 25:
        return '优秀（90-100分）'
    elif score == 20:
        return '良好（80-89分）'
    elif score == 15:
        return '一般（65-79分）'
    else:
        return '较差（<65分）'

def get_profit_text(score):
    if score == 20:
        return '≥1亿营收或≥500万毛利'
    elif score == 10:
        return '≥100万毛利'
    elif score == 5:
        return '≥60万毛利'
    elif score == 2:
        return '≥12万毛利'
    else:
        return '<12万毛利'

@app.route('/api/external-company-data', methods=['POST'])
def get_external_company_data():
    """获取外部企业数据API"""
    try:
        data = request.get_json()
        company_name = data.get('company_name', '').strip()
        
        if not company_name:
            return jsonify({'error': '请输入企业名称'}), 400
            
        # 调用外部数据服务
        company_info = external_service.search_company_info(company_name)
        
        if not company_info or not company_info.company_name:
            return jsonify({'error': '未找到该企业信息'}), 404
            
        # 获取资信评分映射
        credit_mapping = external_service.get_credit_score_mapping(company_info)
        
        # 构建响应数据
        response_data = {
            'company_info': {
                'company_name': company_info.company_name,
                'legal_representative': company_info.legal_representative,
                'registered_capital': company_info.registered_capital,
                'establishment_date': company_info.establishment_date,
                'business_status': company_info.business_status,
                'industry': company_info.industry,
                'credit_code': company_info.credit_code,
                'address': company_info.address,
                'business_scope': company_info.business_scope,
                'years_established': company_info.years_established
            },
            'credit_mapping': credit_mapping,
            'analysis': {
                'enterprise_nature': company_info.enterprise_nature,
                'dishonesty_record': company_info.dishonesty_record,
                'penalty_record': company_info.penalty_record,
                'payment_credit': company_info.payment_credit,
                'peer_review': company_info.peer_review
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'error': f'获取企业数据失败: {str(e)}'}), 500

@app.route('/api/test-external-api', methods=['GET'])
def test_external_api():
    """测试外部API连接"""
    try:
        # 测试小米公司信息
        test_company = "小米科技有限责任公司"
        company_info = external_service.search_company_info(test_company)
        
        if company_info and company_info.company_name:
            return jsonify({
                'status': 'success',
                'message': '外部API连接正常',
                'test_result': {
                    'company_name': company_info.company_name,
                    'legal_representative': company_info.legal_representative,
                    'registered_capital': company_info.registered_capital
                }
            })
        else:
            return jsonify({
                'status': 'failed',
                'message': '外部API无响应或数据为空'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'测试失败: {str(e)}'
        })


@app.route('/api/company-autocomplete', methods=['GET'])
def company_autocomplete():
    """企业名称自动补全接口"""
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 8, type=int)
        
        if not query:
            # 如果没有查询参数，返回热门企业推荐
            suggestions = autocomplete_service.get_popular_companies(limit)
            return jsonify({
                'success': True,
                'data': {
                    'suggestions': [{'name': name, 'type': 'popular'} for name in suggestions],
                    'query': query,
                    'total': len(suggestions)
                }
            })
        
        # 执行搜索
        results = autocomplete_service.search_companies(query, limit)
        
        return jsonify({
            'success': True,
            'data': {
                'suggestions': [
                    {
                        'name': result['name'],
                        'type': result['match_type'],
                        'score': result['score']
                    } for result in results
                ],
                'query': query,
                'total': len(results)
            }
        })
        
        # 将用户输入的企业名称添加到数据库（当实际使用时）
        if len(results) == 0 and len(query) > 2:
            # 可以在这里记录未找到的企业名称，后续可能需要人工添加到数据库
            pass
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/company-suggestions', methods=['POST'])
def add_company_suggestion():
    """添加企业名称到建议数据库"""
    try:
        data = request.json
        company_name = data.get('company_name', '').strip()
        
        if not company_name:
            return jsonify({
                'success': False,
                'error': '企业名称不能为空'
            }), 400
        
        # 添加到自动补全数据库
        autocomplete_service.add_company(company_name)
        
        return jsonify({
            'success': True,
            'message': f'企业名称 "{company_name}" 已添加到建议数据库'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 
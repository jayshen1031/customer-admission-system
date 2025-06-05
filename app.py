from flask import Flask, render_template, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import os
import xlsxwriter
import io

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

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 
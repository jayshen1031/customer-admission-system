#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能企业数据生成器
根据企业名称智能生成完整的企业信息
"""

import re
import random
from datetime import datetime, timedelta
from typing import Dict, Optional


class IntelligentCompanyGenerator:
    """智能企业数据生成器"""
    
    def __init__(self):
        # 行业关键词映射
        self.industry_mapping = {
            '科技': '软件和信息技术服务业',
            '技术': '科技推广和应用服务业', 
            '软件': '软件和信息技术服务业',
            '网络': '互联网和相关服务',
            '信息': '软件和信息技术服务业',
            '光电': '光电设备制造',
            '激光': '专用设备制造业',
            '半导体': '专用设备制造业',
            '电子': '计算机、通信和其他电子设备制造业',
            '铸造': '金属制品业',
            '制造': '专用设备制造业',
            '设备': '专用设备制造业',
            '机械': '通用设备制造业',
            '汽车': '汽车制造业',
            '化工': '化学原料和化学制品制造业',
            '医药': '医药制造业',
            '建筑': '建筑业',
            '贸易': '批发和零售业',
            '投资': '商务服务业',
            '控股': '商务服务业',
            '金融': '金融业',
            '教育': '教育',
            '物流': '运输业',
        }
        
        # 常见法人姓名库
        self.legal_representatives = [
            '张建国', '李志强', '王建军', '刘德华', '陈志明', '赵明华', '周建华',
            '吴志勇', '郑建平', '何志华', '谢建国', '蒋志强', '韩建军', '冯德华',
            '曹志明', '彭明华', '董建华', '袁志勇', '卢建平', '苏志华', '程建国',
            '魏志强', '薛建军', '葛德华', '范志明', '邓明华', '许建华', '傅志勇',
            '沈建平', '曾志华', '毛建国', '段志强', '雷建军', '黎德华', '史志明'
        ]
        
        # 地区映射
        self.region_mapping = {
            '上海': ['上海市浦东新区', '上海市黄浦区', '上海市徐汇区', '上海市长宁区', '上海市静安区'],
            '北京': ['北京市海淀区', '北京市朝阳区', '北京市丰台区', '北京市石景山区', '北京市通州区'],
            '深圳': ['广东省深圳市南山区', '广东省深圳市福田区', '广东省深圳市罗湖区', '广东省深圳市宝安区'],
            '杭州': ['浙江省杭州市西湖区', '浙江省杭州市拱墅区', '浙江省杭州市江干区', '浙江省杭州市下城区'],
            '苏州': ['江苏省苏州市高新区', '江苏省苏州市工业园区', '江苏省苏州市吴中区', '江苏省苏州市相城区'],
            '武汉': ['湖北省武汉市东西湖区', '湖北省武汉市洪山区', '湖北省武汉市江夏区', '湖北省武汉市硚口区'],
            '成都': ['四川省成都市高新区', '四川省成都市锦江区', '四川省成都市青羊区', '四川省成都市武侯区'],
            '西安': ['陕西省西安市高新区', '陕西省西安市雁塔区', '陕西省西安市碑林区', '陕西省西安市莲湖区'],
            '南京': ['江苏省南京市江宁区', '江苏省南京市鼓楼区', '江苏省南京市玄武区', '江苏省南京市建邺区'],
            '青岛': ['山东省青岛市市南区', '山东省青岛市市北区', '山东省青岛市李沧区', '山东省青岛市崂山区']
        }
    
    def generate_company_info(self, company_name: str) -> Dict[str, str]:
        """根据企业名称生成完整的企业信息"""
        
        # 1. 分析企业名称，提取关键信息
        analysis = self._analyze_company_name(company_name)
        
        # 2. 生成基础信息
        legal_representative = random.choice(self.legal_representatives)
        industry = self._determine_industry(company_name)
        region = self._extract_region(company_name)
        address = self._generate_address(region, analysis['business_type'])
        
        # 3. 生成注册资本（基于企业类型和规模）
        registered_capital = self._generate_registered_capital(analysis)
        
        # 4. 生成成立日期
        establishment_date = self._generate_establishment_date(analysis)
        
        # 5. 生成统一社会信用代码
        credit_code = self._generate_credit_code(region)
        
        # 6. 生成经营范围
        business_scope = self._generate_business_scope(industry, analysis['business_type'])
        
        return {
            'company_name': company_name,
            'legal_representative': legal_representative,
            'registered_capital': registered_capital,
            'establishment_date': establishment_date,
            'business_status': '存续',
            'industry': industry,
            'credit_code': credit_code,
            'address': address,
            'business_scope': business_scope
        }
    
    def _analyze_company_name(self, company_name: str) -> Dict[str, str]:
        """分析企业名称，提取关键信息"""
        analysis = {
            'scale': 'medium',  # small, medium, large
            'business_type': 'general',
            'region': None,
            'speciality': None
        }
        
        # 判断企业规模
        if any(keyword in company_name for keyword in ['集团', '控股', '国际']):
            analysis['scale'] = 'large'
        elif any(keyword in company_name for keyword in ['股份', '投资']):
            analysis['scale'] = 'large'
        elif '有限公司' in company_name:
            analysis['scale'] = 'medium'
        else:
            analysis['scale'] = 'small'
        
        # 判断业务类型
        if any(keyword in company_name for keyword in ['科技', '技术', '软件', '网络', '信息']):
            analysis['business_type'] = 'technology'
        elif any(keyword in company_name for keyword in ['制造', '设备', '机械', '工业']):
            analysis['business_type'] = 'manufacturing'
        elif any(keyword in company_name for keyword in ['贸易', '商贸', '进出口']):
            analysis['business_type'] = 'trading'
        elif any(keyword in company_name for keyword in ['投资', '控股', '金融']):
            analysis['business_type'] = 'investment'
        
        # 提取地区信息
        for region in self.region_mapping.keys():
            if region in company_name:
                analysis['region'] = region
                break
        
        return analysis
    
    def _determine_industry(self, company_name: str) -> str:
        """根据企业名称确定行业"""
        for keyword, industry in self.industry_mapping.items():
            if keyword in company_name:
                return industry
        return '商务服务业'  # 默认行业
    
    def _extract_region(self, company_name: str) -> str:
        """从企业名称中提取地区"""
        for region in self.region_mapping.keys():
            if region in company_name:
                return region
        
        # 如果没有明确地区，根据企业特点推断
        if any(keyword in company_name for keyword in ['科技', '软件', '网络']):
            return random.choice(['上海', '北京', '深圳', '杭州'])
        elif any(keyword in company_name for keyword in ['制造', '铸造', '设备']):
            return random.choice(['苏州', '武汉', '青岛', '西安'])
        else:
            return random.choice(['上海', '北京', '深圳'])
    
    def _generate_address(self, region: str, business_type: str) -> str:
        """生成企业地址"""
        base_addresses = self.region_mapping.get(region, ['北京市海淀区'])
        base_address = random.choice(base_addresses)
        
        # 根据业务类型选择合适的园区或街道
        if business_type == 'technology':
            suffixes = ['科技园', '软件园', '创新园区', '高科技园区', '产业园']
        elif business_type == 'manufacturing':
            suffixes = ['工业园区', '制造基地', '产业园', '开发区', '工业区']
        elif business_type == 'trading':
            suffixes = ['商贸区', '经济开发区', '商务区', '贸易中心']
        else:
            suffixes = ['商务区', 'CBD', '金融区', '经济开发区']
        
        suffix = random.choice(suffixes)
        street_number = random.randint(1, 999)
        
        return f"{base_address}{suffix}{street_number}号"
    
    def _generate_registered_capital(self, analysis: Dict[str, str]) -> str:
        """生成注册资本"""
        scale = analysis['scale']
        business_type = analysis['business_type']
        
        if scale == 'large':
            if business_type == 'investment':
                amount = random.randint(50000, 200000)  # 5亿-20亿
            else:
                amount = random.randint(10000, 50000)   # 1亿-5亿
        elif scale == 'medium':
            if business_type == 'manufacturing':
                amount = random.randint(3000, 15000)    # 3000万-1.5亿
            else:
                amount = random.randint(1000, 8000)     # 1000万-8000万
        else:
            amount = random.randint(100, 3000)          # 100万-3000万
        
        return f"{amount}万人民币"
    
    def _generate_establishment_date(self, analysis: Dict[str, str]) -> str:
        """生成成立日期"""
        # 根据企业类型确定成立时间范围
        if analysis['business_type'] == 'technology':
            # 科技企业多为近10-20年成立
            start_year = 2005
            end_year = 2020
        elif analysis['business_type'] == 'manufacturing':
            # 制造企业可能更早
            start_year = 1995
            end_year = 2018
        else:
            start_year = 2000
            end_year = 2019
        
        year = random.randint(start_year, end_year)
        month = random.randint(1, 12)
        day = random.randint(1, 28)  # 避免日期问题
        
        return f"{year}-{month:02d}-{day:02d}"
    
    def _generate_credit_code(self, region: str) -> str:
        """生成统一社会信用代码"""
        # 简化版的信用代码生成（实际应该有复杂的校验规则）
        region_codes = {
            '上海': '91310000',
            '北京': '91110000', 
            '深圳': '91440300',
            '杭州': '91330100',
            '苏州': '91320500',
            '武汉': '91420100',
            '成都': '91510100',
            '西安': '91610100',
            '南京': '91320100',
            '青岛': '91370200'
        }
        
        base_code = region_codes.get(region, '91110000')
        suffix = ''.join([random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789') for _ in range(10)])
        
        return base_code + suffix
    
    def _generate_business_scope(self, industry: str, business_type: str) -> str:
        """生成经营范围"""
        base_scopes = {
            '软件和信息技术服务业': [
                '软件开发', '技术咨询', '技术服务', '技术转让', '计算机系统集成',
                '数据处理', '信息技术咨询', '网络技术开发'
            ],
            '光电设备制造': [
                '光电设备研发', '激光设备制造', '精密光学器件', '光电技术咨询',
                '激光技术服务', '光电产品销售'
            ],
            '金属制品业': [
                '精密铸造', '机械加工', '金属制品制造', '铸造技术咨询',
                '金属表面处理', '模具设计制造'
            ],
            '专用设备制造业': [
                '专用设备制造', '设备技术服务', '机械设备维修',
                '工业自动化设备', '技术开发'
            ]
        }
        
        scopes = base_scopes.get(industry, ['技术开发', '技术咨询', '技术服务'])
        selected_scopes = random.sample(scopes, min(len(scopes), random.randint(3, 6)))
        
        # 添加通用经营范围
        selected_scopes.extend(['进出口贸易', '企业管理咨询'])
        
        return '；'.join(selected_scopes) + '...' 
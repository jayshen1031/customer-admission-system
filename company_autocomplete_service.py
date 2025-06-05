"""
企业名称智能补齐服务
支持模糊搜索和智能建议
"""

import re
import difflib
from typing import List, Dict
import json


class CompanyAutocompleteService:
    """企业名称自动补全服务"""
    
    def __init__(self):
        # 拼音到中文的映射表（仅包含常用企业名称关键词）
        self.pinyin_mapping = {
            'sanxing': '三星',
            'alibaba': '阿里巴巴',
            'tencent': '腾讯', 
            'baidu': '百度',
            'xiaomi': '小米',
            'huawei': '华为',
            'jingdong': '京东',
            'meituan': '美团',
            'didi': '滴滴',
            'samsung': '三星',
            'apple': '苹果',
            'sony': '索尼',
            'lg': 'LG',
            'toyota': '丰田',
            'honda': '本田',
            'nissan': '日产',
            'bmw': '宝马',
            'benz': '奔驰',
            'mercedes': '奔驰',
            # 半导体相关企业拼音映射
            'changxin': '长鑫',
            'cxmt': '长鑫',
            'smic': '中芯',
            'zhongxin': '中芯',
            'tsmc': '台积电',
            'asml': 'ASML',
            'applied': '应用材料',
            'amat': '应用材料',
            'yingyong': '应用',
            'dongdian': '东电',
            'dongdianzhi': '东电',
            'tel': '东京电子',
            'lam': 'Lam',
            'kla': 'KLA',
            'synopsys': '新思',
            'cadence': 'Cadence',
            'nvidia': '英伟达',
            'yingweida': '英伟达',
            'intel': '英特尔',
            'amd': 'AMD',
            'qualcomm': '高通',
            'gaotong': '高通',
            'mediatek': '联发科',
            'lianfake': '联发科',
            'unisoc': '紫光展锐',
            'ziguang': '紫光',
            'hisilicon': '海思',
            'haisi': '海思',
            'zte': '中兴',
            'zhongxing': '中兴',
            'boe': '京东方',
            'jingdongfang': '京东方',
            'tianma': '天马',
            'csot': '华星光电',
            'huaxing': '华星'
        }
        
        # 常见企业名称数据库（可以从真实数据库或API获取）
        self.company_database = [
            # 知名互联网公司
            "阿里巴巴(中国)有限公司",
            "阿里巴巴集团控股有限公司", 
            "腾讯科技(深圳)有限公司",
            "腾讯控股有限公司",
            "百度在线网络技术(北京)有限公司",
            "百度网讯科技有限公司",
            "字节跳动有限公司",
            "字节跳动科技有限公司",
            "小米科技有限责任公司",
            "小米通讯技术有限公司",
            "华为技术有限公司",
            "华为投资控股有限公司",
            "京东科技信息技术有限公司",
            "京东数字科技控股股份有限公司",
            "美团网络科技有限公司",
            "美团点评网络科技有限公司",
            "滴滴出行科技有限公司",
            "北京嘀嘀无限科技发展有限公司",
            
            # 金融机构
            "中国工商银行股份有限公司",
            "中国建设银行股份有限公司", 
            "中国农业银行股份有限公司",
            "中国银行股份有限公司",
            "招商银行股份有限公司",
            "平安银行股份有限公司",
            "中国人寿保险股份有限公司",
            "中国平安保险(集团)股份有限公司",
            "中国太平洋保险(集团)股份有限公司",
            
            # 制造业企业
            "比亚迪股份有限公司",
            "吉利汽车控股有限公司",
            "中国石油化工股份有限公司",
            "中国石油天然气股份有限公司",
            "中国海洋石油有限公司",
            "宝山钢铁股份有限公司",
            "中国神华能源股份有限公司",
            "格力电器股份有限公司",
            "美的集团股份有限公司",
            "海尔智家股份有限公司",
            
            # 国际知名企业
            "三星(中国)投资有限公司",
            "三星电子株式会社",
            "三星半导体(中国)研究开发有限公司",
            "三星显示(中国)有限公司",
            "三星SDI环新(西安)动力电池有限公司",
            "苹果电脑贸易(上海)有限公司",
            "索尼(中国)有限公司",
            "松下电器(中国)有限公司",
            "LG电子(中国)有限公司",
            "丰田汽车(中国)投资有限公司",
            "本田技研工业(中国)投资有限公司",
            "日产(中国)投资有限公司",
            "大众汽车(中国)投资有限公司",
            "宝马(中国)汽车贸易有限公司",
            "奔驰(中国)汽车销售有限公司",
            
            # 房地产公司
            "万科企业股份有限公司",
            "碧桂园控股有限公司",
            "中国恒大集团",
            "融创中国控股有限公司",
            "绿地控股集团股份有限公司",
            "保利发展控股集团股份有限公司",
            "龙湖集团控股有限公司",
            
            # 零售连锁
            "沃尔玛(中国)投资有限公司",
            "家乐福(中国)管理咨询服务有限公司",
            "大润发投资有限公司",
            "苏宁易购集团股份有限公司",
            "国美零售控股有限公司",
            
            # 教育培训
            "新东方教育科技集团有限公司",
            "学而思教育科技有限公司",
            "中公教育科技有限公司",
            "达内时代科技集团有限公司",
            
            # 医药健康
            "恒瑞医药股份有限公司",
            "云南白药集团股份有限公司",
            "同仁堂科技发展股份有限公司",
            "片仔癀药业股份有限公司",
            
            # 半导体和电子设备企业
            "长鑫存储技术有限公司",
            "合肥长鑫集成电路有限公司",
            "中芯国际集成电路制造有限公司",
            "华虹半导体有限公司",
            "紫光集团有限公司",
            "紫光展锐(上海)科技有限公司",
            "海思半导体有限公司",
            "中兴通讯股份有限公司",
            "京东方科技集团股份有限公司",
            "天马微电子股份有限公司",
            "TCL华星光电技术有限公司",
            "维信诺科技股份有限公司",
            "深圳市汇顶科技股份有限公司",
            "兆易创新科技集团股份有限公司",
            "北京君正集成电路股份有限公司",
            "全志科技股份有限公司",
            "瑞芯微电子股份有限公司",
            "士兰微电子股份有限公司",
            "韦尔股份有限公司",
            "圣邦微电子(北京)股份有限公司",
            "卓胜微电子股份有限公司",
            "晶晨半导体(上海)股份有限公司",
            "澜起科技股份有限公司",
            "乐鑫科技(上海)股份有限公司",
            "芯原微电子(上海)股份有限公司",
            "恒玄科技(上海)股份有限公司",
            "晶丰明源半导体股份有限公司",
            "思瑞浦微电子科技(苏州)股份有限公司",
            "芯海科技(深圳)股份有限公司",
            "新洁能股份有限公司",
            "富满微电子集团股份有限公司",
            "上海贝岭股份有限公司",
            "华润微电子有限公司",
            "扬杰科技股份有限公司",
            "捷捷微电子股份有限公司",
            "斯达半导体股份有限公司",
            "立昂微电子股份有限公司",
            "通富微电子股份有限公司",
            "华天科技股份有限公司",
            "长电科技股份有限公司",
            "晶方科技股份有限公司",
            "太极实业股份有限公司",
            "深南电路股份有限公司",
            "沪电股份有限公司",
            "景嘉微电子股份有限公司",
            
            # 半导体设备企业
            "北方华创科技集团股份有限公司",
            "中微半导体设备(上海)股份有限公司",
            "拓荆科技股份有限公司",
            "华海清科股份有限公司",
            "盛美上海半导体设备股份有限公司",
            "芯源微半导体设备(上海)股份有限公司",
            "万业企业股份有限公司",
            "晶盛机电股份有限公司",
            "长川科技股份有限公司",
            "精测电子科技股份有限公司",
            "华峰测控技术股份有限公司",
            "奥普特科技股份有限公司",
            
            # 国际半导体企业
            "台湾积体电路制造股份有限公司",
            "联发科技股份有限公司",
            "联华电子股份有限公司",
            "日月光半导体制造股份有限公司",
            "英特尔(中国)有限公司",
            "英伟达(上海)企业管理有限公司",
            "高通(中国)控股有限公司",
            "博通集成电路(上海)股份有限公司",
            "美满电子科技(上海)有限公司",
            "新思科技(上海)有限公司",
            "楷登电子科技(上海)有限公司",
            "应用材料(中国)有限公司",
            "泛林集团(上海)贸易有限公司",
            "科磊半导体技术(上海)有限公司",
            "东京电子(上海)有限公司",
            "阿斯麦(上海)贸易有限公司",
            "爱德万测试技术(北京)有限公司",
            
            # 存储器企业
            "长江存储科技有限责任公司",
            "福建晋华集成电路有限公司",
            "兆易创新科技集团股份有限公司",
            "江波龙电子股份有限公司",
            "佰维存储科技股份有限公司",
            "东芯半导体股份有限公司",
            "普冉半导体(上海)股份有限公司",
            "聚辰半导体股份有限公司",
            "恒烁半导体(合肥)股份有限公司",
        ]
        
        # 构建搜索索引
        self._build_search_index()
        
    def _build_search_index(self):
        """构建搜索索引"""
        self.search_index = {}
        
        for company in self.company_database:
            # 提取关键词
            keywords = self._extract_keywords(company)
            
            for keyword in keywords:
                if keyword not in self.search_index:
                    self.search_index[keyword] = []
                if company not in self.search_index[keyword]:
                    self.search_index[keyword].append(company)
    
    def _extract_keywords(self, company_name: str) -> List[str]:
        """从企业名称中提取关键词"""
        keywords = []
        
        # 移除常见后缀
        suffixes = ['有限公司', '股份有限公司', '集团有限公司', '控股有限公司', 
                   '科技有限公司', '投资有限公司', '发展有限公司', '管理有限公司',
                   '集团股份有限公司', '控股股份有限公司', '(中国)', '(集团)', '(控股)',
                   '(上海)', '(北京)', '(深圳)', '(广州)', '(天津)', '(西安)', '(南京)',
                   '(苏州)', '(杭州)', '(成都)', '(重庆)', '(武汉)', '(青岛)', '(厦门)']
        
        clean_name = company_name
        for suffix in suffixes:
            clean_name = clean_name.replace(suffix, '')
        
        # 添加特殊的简称映射
        abbreviation_mappings = {
            '东京电子': ['东电', '东京', '电子'],
            '应用材料': ['应材', '应用', '材料'],
            '长鑫存储': ['长鑫', '存储'],
            '中芯国际': ['中芯', '国际'],
            '台积电': ['台积', '积电'],
            '联发科': ['联发', '发科'],
            '紫光展锐': ['紫光', '展锐'],
            '海思半导体': ['海思', '半导体'],
            '京东方': ['京东方', 'BOE'],
            '华星光电': ['华星', '光电'],
            '三星电子': ['三星', '电子'],
            '英伟达': ['英伟达', 'NVIDIA'],
            '高通': ['高通', 'Qualcomm'],
            '英特尔': ['英特尔', 'Intel'],
            '阿斯麦': ['阿斯麦', 'ASML']
        }
        
        # 检查是否有特殊简称映射
        for full_name, abbreviations in abbreviation_mappings.items():
            if full_name in clean_name:
                keywords.extend(abbreviations)
        
        # 提取中文字符
        chinese_chars = re.findall(r'[\u4e00-\u9fff]+', clean_name)
        
        for chars in chinese_chars:
            # 添加完整词组
            if len(chars) >= 2:
                keywords.append(chars)
            
            # 添加2-4字的子串
            for i in range(len(chars)):
                for j in range(i + 2, min(i + 5, len(chars) + 1)):
                    substring = chars[i:j]
                    if len(substring) >= 2:
                        keywords.append(substring)
        
        return keywords
    
    def search_companies(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索企业名称"""
        if not query or len(query) < 2:
            return []
        
        query = query.strip()
        results = []
        seen = set()
        
        # 0. 拼音匹配（优先级最高）
        query_lower = query.lower()
        for pinyin, chinese in self.pinyin_mapping.items():
            if query_lower == pinyin or query_lower in pinyin:
                # 使用中文关键词搜索
                for company in self.company_database:
                    if chinese in company and company not in seen:
                        results.append({
                            'name': company,
                            'match_type': 'pinyin',
                            'score': 95
                        })
                        seen.add(company)
        
        # 1. 精确匹配
        for company in self.company_database:
            if query in company and company not in seen:
                results.append({
                    'name': company,
                    'match_type': 'exact',
                    'score': 100
                })
                seen.add(company)
        
        # 2. 关键词匹配
        for keyword, companies in self.search_index.items():
            if query == keyword or query in keyword:
                for company in companies:
                    if company not in seen:
                        # 计算匹配度
                        score = self._calculate_match_score(query, company)
                        if score > 30:  # 降低阈值，让更多结果通过
                            results.append({
                                'name': company,
                                'match_type': 'keyword',
                                'score': score
                            })
                            seen.add(company)
        
        # 3. 模糊匹配
        if len(results) < limit:
            for company in self.company_database:
                if company not in seen:
                    # 使用编辑距离进行模糊匹配
                    similarity = difflib.SequenceMatcher(None, query.lower(), company.lower()).ratio()
                    if similarity > 0.3:  # 相似度阈值
                        results.append({
                            'name': company,
                            'match_type': 'fuzzy',
                            'score': int(similarity * 100)
                        })
                        seen.add(company)
        
        # 按相关度排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results[:limit]
    
    def _calculate_match_score(self, query: str, company_name: str) -> int:
        """计算匹配度分数"""
        query = query.lower()
        company = company_name.lower()
        
        # 基础分数
        base_score = 0
        
        # 检查是否是特殊简称匹配
        abbreviation_mappings = {
            '东电': '东京电子',
            '应材': '应用材料',
            '长鑫': '长鑫存储',
            '中芯': '中芯国际',
            '台积': '台积电',
            '联发': '联发科',
            '紫光': '紫光展锐',
            '海思': '海思半导体',
            '华星': '华星光电',
            '三星': '三星电子',
        }
        
        # 如果是简称匹配，给予高分
        if query in abbreviation_mappings:
            full_name = abbreviation_mappings[query]
            if full_name in company:
                base_score += 90  # 简称匹配高分
        
        # 开头匹配加分
        if company.startswith(query):
            base_score += 50
        
        # 包含关系加分
        if query in company:
            base_score += 30
        
        # 字符覆盖率
        coverage = sum(1 for char in query if char in company) / len(query)
        base_score += int(coverage * 20)
        
        return min(base_score, 100)
    
    def get_popular_companies(self, limit: int = 20) -> List[str]:
        """获取热门企业名称"""
        # 返回一些知名企业作为热门推荐
        popular = [
            "阿里巴巴(中国)有限公司",
            "腾讯科技(深圳)有限公司", 
            "百度在线网络技术(北京)有限公司",
            "小米科技有限责任公司",
            "华为技术有限公司",
            "京东科技信息技术有限公司",
            "美团网络科技有限公司",
            "字节跳动有限公司",
            "中国工商银行股份有限公司",
            "中国建设银行股份有限公司",
            "招商银行股份有限公司",
            "比亚迪股份有限公司",
            "格力电器股份有限公司",
            "美的集团股份有限公司",
            "万科企业股份有限公司",
            "碧桂园控股有限公司",
            "新东方教育科技集团有限公司",
            "恒瑞医药股份有限公司",
            "苏宁易购集团股份有限公司",
            "滴滴出行科技有限公司"
        ]
        return popular[:limit]
    
    def add_company(self, company_name: str):
        """动态添加企业名称到数据库"""
        if company_name and company_name not in self.company_database:
            self.company_database.append(company_name)
            # 重建索引
            self._build_search_index()
    
    def get_suggestions_for_partial(self, partial: str) -> List[str]:
        """根据部分输入获取建议"""
        suggestions = []
        
        if len(partial) >= 2:
            results = self.search_companies(partial, limit=8)
            suggestions = [result['name'] for result in results]
        
        return suggestions


# 全局实例
autocomplete_service = CompanyAutocompleteService()


# 测试功能
if __name__ == "__main__":
    service = CompanyAutocompleteService()
    
    test_queries = ["阿里", "腾讯", "百度", "小米", "银行", "科技"]
    
    for query in test_queries:
        print(f"\n搜索: '{query}'")
        results = service.search_companies(query, limit=5)
        for result in results:
            print(f"  {result['name']} (匹配度: {result['score']}%)") 
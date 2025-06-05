#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试新的评级标准和同行客户限制
"""

import requests
import json

# 测试数据
test_cases = [
    {
        "name": "高分直接客户",
        "data": {
            "customerName": "腾讯科技有限公司",
            "customerType": "direct",
            "industry": "10",
            "businessType": "15", 
            "influence": "10",
            "logisticsScale": "10",
            "creditScore": "25",
            "profitEstimate": "15"
        },
        "expected_grade": "A+",
        "expected_score": 95
    },
    {
        "name": "中等分数直接客户",
        "data": {
            "customerName": "中等公司",
            "customerType": "direct",
            "industry": "5",
            "businessType": "12",
            "influence": "8",
            "logisticsScale": "8",
            "creditScore": "20",
            "profitEstimate": "10"
        },
        "expected_grade": "A",
        "expected_score": 83
    },
    {
        "name": "B级直接客户",
        "data": {
            "customerName": "B级公司",
            "customerType": "direct",
            "industry": "5",
            "businessType": "12",
            "influence": "4",
            "logisticsScale": "6",
            "creditScore": "15",
            "profitEstimate": "5"
        },
        "expected_grade": "B",
        "expected_score": 72
    },
    {
        "name": "C级直接客户",
        "data": {
            "customerName": "C级公司",
            "customerType": "direct",
            "industry": "5",
            "businessType": "12",
            "influence": "4",
            "logisticsScale": "4",
            "creditScore": "15",
            "profitEstimate": "2"
        },
        "expected_grade": "C",
        "expected_score": 62
    },
    {
        "name": "D级直接客户",
        "data": {
            "customerName": "D级公司",
            "customerType": "direct",
            "industry": "5",
            "businessType": "12",
            "influence": "4",
            "logisticsScale": "2",
            "creditScore": "5",
            "profitEstimate": "0"
        },
        "expected_grade": "D",
        "expected_score": 48
    },
    {
        "name": "高分同行客户（应限制为C级）",
        "data": {
            "customerName": "高分同行公司",
            "customerType": "peer",
            "industry": "10",
            "businessType": "15",
            "influence": "10",
            "logisticsScale": "10",
            "creditScore": "25",
            "profitEstimate": "15"
        },
        "expected_grade": "C",
        "expected_score": 95,
        "is_peer_limited": True
    },
    {
        "name": "中等分同行客户（应限制为C级）",
        "data": {
            "customerName": "中等同行公司",
            "customerType": "peer",
            "industry": "5",
            "businessType": "12",
            "influence": "8",
            "logisticsScale": "8",
            "creditScore": "20",
            "profitEstimate": "10"
        },
        "expected_grade": "C",
        "expected_score": 83,
        "is_peer_limited": True
    },
    {
        "name": "低分同行客户（D级）",
        "data": {
            "customerName": "低分同行公司",
            "customerType": "peer",
            "industry": "5",
            "businessType": "12",
            "influence": "4",
            "logisticsScale": "2",
            "creditScore": "5",
            "profitEstimate": "0"
        },
        "expected_grade": "D",
        "expected_score": 48,
        "is_peer_limited": False
    }
]

def test_rating_api():
    """测试评级API"""
    base_url = "http://localhost:5001"
    
    print("🧪 开始测试新的评级标准...")
    print("=" * 60)
    
    success_count = 0
    total_count = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 测试用例 {i}: {test_case['name']}")
        print("-" * 40)
        
        try:
            # 发送评级请求
            response = requests.post(
                f"{base_url}/api/rating",
                json=test_case['data'],
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    data = result['data']
                    actual_grade = data['grade']
                    actual_score = data['total_score']
                    message = data.get('message', '')
                    
                    print(f"✅ 请求成功")
                    print(f"   客户名称: {test_case['data']['customerName']}")
                    print(f"   客户类型: {test_case['data']['customerType']}")
                    print(f"   实际得分: {actual_score}")
                    print(f"   实际等级: {actual_grade}")
                    print(f"   期望得分: {test_case['expected_score']}")
                    print(f"   期望等级: {test_case['expected_grade']}")
                    
                    # 验证结果
                    score_match = actual_score == test_case['expected_score']
                    grade_match = actual_grade == test_case['expected_grade']
                    
                    if score_match and grade_match:
                        print(f"✅ 测试通过")
                        success_count += 1
                        
                        # 检查同行客户限制消息
                        if test_case.get('is_peer_limited'):
                            if "同行客户限制" in message:
                                print(f"✅ 同行客户限制消息正确: {message}")
                            else:
                                print(f"⚠️  同行客户限制消息缺失")
                        
                    else:
                        print(f"❌ 测试失败")
                        if not score_match:
                            print(f"   得分不匹配: 期望{test_case['expected_score']}, 实际{actual_score}")
                        if not grade_match:
                            print(f"   等级不匹配: 期望{test_case['expected_grade']}, 实际{actual_grade}")
                    
                    if message:
                        print(f"   系统消息: {message}")
                        
                else:
                    print(f"❌ API返回错误: {result.get('error', '未知错误')}")
                    
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                print(f"   响应内容: {response.text}")
                # 尝试解析错误响应中的JSON信息
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        print(f"   错误详情: {error_data['error']}")
                except json.JSONDecodeError:
                    pass  # 响应不是JSON格式，已经显示原始内容
                
        except requests.exceptions.ConnectionError:
            print(f"❌ 连接失败: 请确保Flask应用正在运行 (http://localhost:5001)")
            print(f"   提示: 可以运行 'python app.py' 启动服务器")
            break
        except requests.exceptions.Timeout:
            print(f"❌ 请求超时: 服务器响应时间过长")
        except requests.exceptions.RequestException as e:
            print(f"❌ 请求异常: {str(e)}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON解析错误: 服务器返回的不是有效的JSON格式")
            print(f"   响应内容: {response.text if 'response' in locals() else '无响应'}")
        except Exception as e:
            print(f"❌ 测试异常: {str(e)}")
            print(f"   异常类型: {type(e).__name__}")
    
    print("\n" + "=" * 60)
    print(f"📊 测试总结:")
    print(f"   总测试数: {total_count}")
    print(f"   成功数: {success_count}")
    print(f"   失败数: {total_count - success_count}")
    print(f"   成功率: {success_count/total_count*100:.1f}%")
    
    if success_count == total_count:
        print("🎉 所有测试通过！新的评级标准工作正常。")
    else:
        print("⚠️  部分测试失败，请检查实现。")

def test_statistics_api():
    """测试统计API是否包含D级"""
    print("\n🧪 测试统计API...")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:5001/api/statistics")
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                data = result['data']
                print("✅ 统计API响应成功")
                print(f"   总数: {data.get('total', 0)}")
                print(f"   A+级: {data.get('aplus_count', 0)}")
                print(f"   A级: {data.get('a_count', 0)}")
                print(f"   B级: {data.get('b_count', 0)}")
                print(f"   C级: {data.get('c_count', 0)}")
                print(f"   D级: {data.get('d_count', 0)}")
                
                if 'd_count' in data:
                    print("✅ D级统计字段存在")
                else:
                    print("❌ D级统计字段缺失")
            else:
                print(f"❌ 统计API错误: {result.get('error')}")
        else:
            print(f"❌ 统计API HTTP错误: {response.status_code}")
            print(f"   响应内容: {response.text}")
            # 尝试解析错误响应中的JSON信息
            try:
                error_data = response.json()
                if 'error' in error_data:
                    print(f"   错误详情: {error_data['error']}")
            except json.JSONDecodeError:
                pass  # 响应不是JSON格式，已经显示原始内容
            
    except requests.exceptions.ConnectionError:
        print(f"❌ 统计API连接失败: 请确保Flask应用正在运行 (http://localhost:5001)")
    except requests.exceptions.Timeout:
        print(f"❌ 统计API请求超时: 服务器响应时间过长")
    except requests.exceptions.RequestException as e:
        print(f"❌ 统计API请求异常: {str(e)}")
    except json.JSONDecodeError as e:
        print(f"❌ 统计API JSON解析错误: 服务器返回的不是有效的JSON格式")
        print(f"   响应内容: {response.text if 'response' in locals() else '无响应'}")
    except Exception as e:
        print(f"❌ 统计API测试异常: {str(e)}")
        print(f"   异常类型: {type(e).__name__}")

if __name__ == "__main__":
    test_rating_api()
    test_statistics_api() 
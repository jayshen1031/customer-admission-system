#!/bin/bash
# Cursor Chat Memory 便捷脚本

# 检查是否安装了 cursor-chat-memory
if ! command -v cursor-memory &> /dev/null; then
    echo "❌ cursor-memory CLI 未安装"
    echo "💡 请运行: npm install -g cursor-chat-memory"
    exit 1
fi

# 设置项目上下文
cursor-memory set-project "$(pwd)"

# 执行命令
cursor-memory "$@"

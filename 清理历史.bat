@echo off
echo 正在清理 Git 历史中的敏感信息...
echo.

REM 从历史中移除包含 token 的文件
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch '部署步骤详细指南.md' '部署指南.md'" --prune-empty --tag-name-filter cat -- --all

echo.
echo 清理完成！
echo 现在可以尝试推送了
pause



# 17_Slash命令

## 元数据
```json
{
  "uid": 323727,
  "displayIndex": 18,
  "comment": "17_Slash命令",
  "disable": true,
  "constant": true,
  "selective": false,
  "key": [],
  "selectiveLogic": 0,
  "keysecondary": [],
  "scanDepth": null,
  "vectorized": false,
  "position": 0,
  "role": null,
  "depth": 4,
  "order": 19,
  "useProbability": true,
  "probability": 100,
  "excludeRecursion": true,
  "preventRecursion": true,
  "delayUntilRecursion": false,
  "sticky": null,
  "cooldown": null,
  "delay": null,
  "addMemo": true,
  "matchPersonaDescription": false,
  "matchCharacterDescription": false,
  "matchCharacterPersonality": false,
  "matchCharacterDepthPrompt": false,
  "matchScenario": false,
  "matchCreatorNotes": false,
  "group": "",
  "groupOverride": false,
  "groupWeight": 100,
  "caseSensitive": null,
  "matchWholeWords": null,
  "useGroupScoring": null,
  "automationId": "",
  "ignoreBudget": false,
  "outletName": "",
  "triggers": [],
  "characterFilter": {
    "isExclude": false,
    "names": [],
    "tags": []
  }
}
```

## 内容

【Slash命令】
来源: @types/function/slash.d.ts
用途: 运行酒馆的STScript命令(如弹窗提示、刷新页面、触发AI回复等)

════════════════════════════════════════

triggerSlash(command) → Promise<string>

  运行酒馆Slash命令，返回管道结果
  命令写错不会有反馈，出错会抛出异常

  注意: 优先使用酒馆助手接口而非Slash命令!
  Slash命令难以与代码结合，仅在没有对应接口时使用。

  常用命令示例:

    // 弹出通知(但更建议用 toastr.success('成功!'))
    triggerSlash('/echo severity=success 运行成功!');

    // 触发AI回复(先创建用户消息，再触发)
    await createChatMessages([{role:'user', message:'你好'}]);
    await triggerSlash('/trigger');

    // 刷新页面
    triggerSlash('/reload-page');

    // 获取最后一条消息的id(但更建议用 getLastMessageId())
    const id = await triggerSlash('/pass {{lastMessageId}}');

  完整命令列表请参考项目中的 slash_command.txt 文件。


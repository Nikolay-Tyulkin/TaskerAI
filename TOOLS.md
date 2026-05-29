# TOOLS.md

Этот файл фиксирует, какие инструменты нужны для агентной End2End-разработки, что доступно через opencode, а что должно быть установлено в системе или проекте отдельно.

## Что дает opencode

opencode может работать с проектом через свои встроенные инструменты и через терминал. Эти возможности не требуют отдельной установки MCP-серверов:

| Возможность | Что дает | Что важно помнить |
| --- | --- | --- |
| Работа с файлами | Читать, создавать и изменять файлы проекта | Разрешения управляются в `opencode.json` через `permission` |
| Поиск по проекту | Искать файлы и текст в кодовой базе | Работает внутри доступного workspace |
| Терминал | Запускать команды, тесты, сборку и утилиты | Сама команда должна быть установлена в системе |
| Web-доступ | Сверяться с публичной документацией, если инструмент доступен | В `opencode.json` можно поставить `webfetch: ask` |
| Skills | Загружать проектные навыки из `.opencode/skills/<name>/SKILL.md` | Skill должен иметь `name` и `description` |
| Agents | Использовать специализированных агентов из `.opencode/agents/*.md` | После изменения файлов агентов перезапустите opencode |

Важно: opencode может вызвать `git status`, `node --version` или `docker compose`, но эти команды сработают только если Git, Node.js или Docker уже установлены.

## Что нужно установить отдельно

Для разработки понадобятся внешние инструменты. Устанавливайте только то, чего нет в вашей системе.

Перед установкой проверьте наличие инструментов:

```bash
git --version
node --version
npm --version
python --version
docker --version
docker compose version
```

## Git

Git нужен для контроля изменений, просмотра diff и фиксации результатов.

### Windows

```powershell
winget install --id Git.Git -e
git --version
```

### macOS

```bash
brew install git
git --version
```

Если Homebrew не установлен:

```bash
xcode-select --install
git --version
```

### Linux Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y git
git --version
```

## Node.js и npm

Node.js и npm нужны для frontend-проекта на React, TypeScript и Vite.

### Windows

```powershell
winget install --id OpenJS.NodeJS.LTS -e
node --version
npm --version
```

### macOS

```bash
brew install node
node --version
npm --version
```

### Linux Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## Python

Python нужен для backend-проекта на FastAPI и тестов Pytest.

### Windows

```powershell
winget install --id Python.Python.3.12 -e
python --version
pip --version
```

### macOS

```bash
brew install python
python3 --version
pip3 --version
```

### Linux Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
python3 --version
pip3 --version
```

## Docker Desktop или Docker Engine

Docker нужен для контейнерного запуска frontend, backend и базы данных, когда проект дойдет до контейнеризации.

### Windows

```powershell
winget install --id Docker.DockerDesktop -e
docker --version
docker compose version
```

После установки Docker Desktop нужно запустить вручную и дождаться статуса Running.

### macOS

```bash
brew install --cask docker
docker --version
docker compose version
```

После установки Docker Desktop нужно запустить вручную и дождаться статуса Running.

### Linux Ubuntu

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version
docker compose version
```

Чтобы запускать Docker без `sudo`:

```bash
sudo usermod -aG docker $USER
```

После этой команды нужно выйти из системы и войти заново.

## Playwright

Playwright нужен для проверки frontend и End2End-сценариев. Обычно он устанавливается позже внутри frontend-проекта.

Проверка после создания frontend-проекта:

```bash
npx playwright --version
```

Установка браузеров Playwright внутри frontend-проекта:

```bash
npm install -D @playwright/test
npx playwright install
```

На Linux может потребоваться установка системных зависимостей:

```bash
npx playwright install --with-deps
```

## MCP-серверы

MCP в opencode - это дополнительный способ подключить внешние инструменты. На старте разработки MCP не обязателен.

Если MCP понадобится позже, он настраивается в `opencode.json` в секции `mcp`.

Локальный MCP-сервер:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-local-mcp": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      "enabled": true
    }
  }
}
```

Удаленный MCP-сервер:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-remote-mcp": {
      "type": "remote",
      "url": "https://example.com/mcp",
      "enabled": true
    }
  }
}
```

Правила проекта для MCP:

- не подключать MCP без конкретной необходимости;
- включать только те MCP-серверы, которые реально нужны задаче;
- помнить, что MCP добавляет инструменты и контекст в сессию;
- хранить ключи и токены только в переменных окружения;
- после изменения `opencode.json` перезапускать opencode.

## Минимальная готовность к разработке

Перед переходом к подготовке технического задания и реализации достаточно:

- opencode открывает проект и может читать файлы;
- `AGENTS.md`, `opencode.json`, `.opencode/agents` и `.opencode/skills` лежат в корне проекта;
- терминал в opencode запускает команды;
- установлен Git;
- установлены Node.js и npm;
- установлен Python;
- понятно, установлен ли Docker или его установка отложена до этапа контейнеризации;
- ограничения по отсутствующим инструментам записаны в итогах настройки.

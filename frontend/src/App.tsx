import { ConfigProvider } from 'antd'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
    <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
      <TasksPage />
    </ConfigProvider>
  )
}

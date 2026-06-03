import { Button, Card, Form, Input, Select, Space } from 'antd'
import { useEffect } from 'react'
import type { TaskFilters } from '../types/task'
import type { StatusItem } from '../api/statuses'
import type { TagItem } from '../api/tags'

type TaskFiltersProps = {
  filters: TaskFilters
  loading: boolean
  statuses: StatusItem[]
  tags: TagItem[]
  onApply: (filters: TaskFilters) => void
  onReset: () => void
}

const priorityOptions = ['Низкий', 'Средний', 'Высокий']

export function TaskFiltersView({ filters, loading, statuses, tags, onApply, onReset }: TaskFiltersProps) {
  const [form] = Form.useForm<TaskFilters>()

  useEffect(() => {
    form.setFieldsValue(filters)
  }, [filters, form])

  return (
    <Card title="Фильтры" className="panel-card">
      <Form form={form} layout="vertical" initialValues={filters} onFinish={onApply}>
        <div className="filters-grid">
          <Form.Item label="Статус" name="status">
            <Select allowClear placeholder="Любой статус" options={statuses.map((item) => ({ value: item.name, label: item.name }))} />
          </Form.Item>
          <Form.Item label="Приоритет" name="priority">
            <Select allowClear placeholder="Любой приоритет" options={priorityOptions.map((value) => ({ value }))} />
          </Form.Item>
          <Form.Item label="Поиск" name="search">
            <Input allowClear placeholder="Название или описание" />
          </Form.Item>
          <Form.Item label="Тег" name="tag">
            <Select allowClear placeholder="Любой тег" options={tags.map((item) => ({ value: item.id, label: item.name }))} />
          </Form.Item>
          <Form.Item label="Дедлайн с" name="deadline_from">
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Дедлайн по" name="deadline_to">
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Сортировать по" name="sort_by">
            <Select
              allowClear
              placeholder="Дата создания"
              options={[
                { value: 'created_at', label: 'Дата создания' },
                { value: 'deadline', label: 'Дедлайн' },
                { value: 'priority', label: 'Приоритет' },
                { value: 'status', label: 'Статус' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Порядок" name="sort_order">
            <Select
              allowClear
              placeholder="По убыванию"
              options={[
                { value: 'desc', label: 'По убыванию' },
                { value: 'asc', label: 'По возрастанию' },
              ]}
            />
          </Form.Item>
        </div>
        <Space wrap>
          <Button type="primary" htmlType="submit" loading={loading}>
            Применить
          </Button>
          <Button
            onClick={() => {
              form.resetFields()
              onReset()
            }}
          >
            Сбросить
          </Button>
        </Space>
      </Form>
    </Card>
  )
}

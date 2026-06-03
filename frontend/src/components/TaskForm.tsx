import { Button, Form, Input, Select, Space } from 'antd'
import type { StatusItem } from '../api/statuses'
import type { TagItem } from '../api/tags'
import type { Task, TaskPayload } from '../types/task'

type TaskFormProps = {
  task?: Task | null
  submitting: boolean
  statuses: StatusItem[]
  tags: TagItem[]
  onSubmit: (payload: TaskPayload) => Promise<boolean>
  onCancelEdit: () => void
}

const priorityOptions = ['Низкий', 'Средний', 'Высокий']

export function TaskForm({ task, submitting, statuses, tags, onSubmit, onCancelEdit }: TaskFormProps) {
  const [form] = Form.useForm<TaskPayload>()
  const isEditing = Boolean(task)

  async function handleFinish(payload: TaskPayload) {
    const success = await onSubmit(payload)
    if (success && !isEditing) {
      form.resetFields()
    }
  }

  return (
    <Form
      key={task?.id ?? 'new'}
      form={form}
      layout="vertical"
      initialValues={{
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: task?.status ?? 'К выполнению',
        priority: task?.priority ?? undefined,
        deadline: task?.deadline ?? undefined,
        tag_ids: task?.tags.map((tag) => tag.id) ?? [],
      }}
      onFinish={handleFinish}
    >
      <Form.Item
        label="Название"
        name="title"
        rules={[{ required: true, whitespace: true, message: 'Введите название задачи' }]}
      >
        <Input maxLength={120} placeholder="Например, подготовить план" />
      </Form.Item>
      <Form.Item label="Описание" name="description">
        <Input.TextArea maxLength={4000} rows={4} placeholder="Необязательное описание" />
      </Form.Item>
      <div className="form-grid">
        <Form.Item label="Статус" name="status" rules={[{ required: true, message: 'Выберите статус' }]}>
          <Select options={statuses.map((item) => ({ value: item.name, label: item.name }))} />
        </Form.Item>
        <Form.Item label="Приоритет" name="priority">
          <Select allowClear placeholder="Не выбран" options={priorityOptions.map((value) => ({ value }))} />
        </Form.Item>
        <Form.Item label="Дедлайн" name="deadline">
          <Input type="date" />
        </Form.Item>
        <Form.Item label="Теги" name="tag_ids">
          <Select mode="multiple" placeholder="Выберите теги" options={tags.map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item>
      </div>
      <Space wrap>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {isEditing ? 'Сохранить' : 'Создать'}
        </Button>
        {isEditing ? <Button onClick={onCancelEdit}>Отменить редактирование</Button> : null}
      </Space>
    </Form>
  )
}

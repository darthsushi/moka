import { Button, Dropdown, Header } from "@heroui/react";

function Notifications() {

  return (
    <div className="w-full h-auto px-4 pb-2">
      <Dropdown>
        <Button
          fullWidth
          aria-label="notifications"
          variant="outline"
          size="lg"
        >
          Notificaciones
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => console.log(`Selected: ${key}`)}>
            <Dropdown.Section>
              <Header>Pendiente</Header>
              <Dropdown.Item id="new-file" textValue="New file">
                Noti 1
              </Dropdown.Item>
              <Dropdown.Item id="edit-file" textValue="Edit file">
                Noti 2
              </Dropdown.Item>
            </Dropdown.Section>
            <Dropdown.Section>
              <Header>Anteriores</Header>
              <Dropdown.Item id="delete-file" textValue="Delete file" variant="danger">
                Noti 3
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  )
};

export default Notifications;

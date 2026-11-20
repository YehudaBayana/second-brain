import { Container, Skeleton, Stack } from "@mantine/core";

export default function DatabaseTablesLoading() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Skeleton height={36} width={240} />
        <Skeleton height={220} radius="md" />
        <Skeleton height={220} radius="md" />
      </Stack>
    </Container>
  );
}

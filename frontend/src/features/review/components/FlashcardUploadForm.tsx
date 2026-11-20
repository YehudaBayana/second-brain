import { useState, useEffect } from "react";
import {
  Stepper,
  Tabs,
  Textarea,
  FileInput,
  Button,
  Group,
  Paper,
  Text,
  Image,
  Stack,
  Badge,
  Container,
} from "@mantine/core";

interface FlashcardData {
  frontText: string;
  frontImage: File | null;
  backText: string;
  backImage: File | null;
}

export function FlashcardUploadForm() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string | null>("front");
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const [cardData, setCardData] = useState<FlashcardData>({
    frontText: "",
    frontImage: null,
    backText: "",
    backImage: null,
  });

  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);

  // Clean up old URLs from browser memory when they change or when the component closes
  useEffect(() => {
    return () => {
      if (frontImageUrl) URL.revokeObjectURL(frontImageUrl);
    };
  }, [frontImageUrl]);

  useEffect(() => {
    return () => {
      if (backImageUrl) URL.revokeObjectURL(backImageUrl);
    };
  }, [backImageUrl]);

  // Create the preview URL right when the user selects or clears a file
  const handleFrontImageChange = (file: File | null) => {
    setCardData((prev) => ({ ...prev, frontImage: file }));
    setFrontImageUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleBackImageChange = (file: File | null) => {
    setCardData((prev) => ({ ...prev, backImage: file }));
    setBackImageUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleNextStep = () => {
    setIsFlipped(false);
    setActiveStep(1);
  };

  const handlePrevStep = () => {
    setActiveStep(0);
  };

  const handleSubmit = () => {
    console.log("Uploaded Flashcard:", cardData);
    alert("Flashcard submitted!");
  };

  const isFormValid =
    (cardData.frontText.trim() !== "" || cardData.frontImage !== null) &&
    (cardData.backText.trim() !== "" || cardData.backImage !== null);

  return (
    <Container size="sm" py="xl">
      <Stepper
        active={activeStep}
        onStepClick={setActiveStep}
        allowNextStepsSelect={isFormValid}
      >
        {/* STEP 1: UPLOAD FORM WITH FRONT & BACK TABS */}
        <Stepper.Step label="Step 1" description="Create flashcard">
          <Paper withBorder shadow="sm" p="lg" mt="md" radius="md">
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List grow mb="md">
                <Tabs.Tab value="front">Front Side</Tabs.Tab>
                <Tabs.Tab value="back">Back Side</Tabs.Tab>
              </Tabs.List>

              {/* FRONT TAB */}
              <Tabs.Panel value="front">
                <Stack gap="md">
                  <Textarea
                    label="Front Text (Question or Term)"
                    placeholder="Write what goes on the front..."
                    minRows={4}
                    value={cardData.frontText}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        frontText: e.currentTarget.value,
                      })
                    }
                  />
                  <FileInput
                    label="Front Image (Optional)"
                    placeholder="Choose an image file"
                    accept="image/*"
                    clearable
                    value={cardData.frontImage}
                    onChange={handleFrontImageChange}
                  />
                </Stack>
              </Tabs.Panel>

              {/* BACK TAB */}
              <Tabs.Panel value="back">
                <Stack gap="md">
                  <Textarea
                    label="Back Text (Answer or Definition)"
                    placeholder="Write what goes on the back..."
                    minRows={4}
                    value={cardData.backText}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        backText: e.currentTarget.value,
                      })
                    }
                  />
                  <FileInput
                    label="Back Image (Optional)"
                    placeholder="Choose an image file"
                    accept="image/*"
                    clearable
                    value={cardData.backImage}
                    onChange={handleBackImageChange}
                  />
                </Stack>
              </Tabs.Panel>
            </Tabs>

            <Group justify="flex-end" mt="xl">
              <Button onClick={handleNextStep} disabled={!isFormValid}>
                Next: Preview Card
              </Button>
            </Group>
          </Paper>
        </Stepper.Step>

        {/* STEP 2: FLASHCARD PREVIEW */}
        <Stepper.Step label="Step 2" description="Preview & upload">
          <Stack mt="md" gap="md">
            <Paper
              withBorder
              shadow="md"
              p="xl"
              radius="md"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                minHeight: 280,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Group justify="space-between">
                <Badge color={isFlipped ? "green" : "blue"} variant="light">
                  {isFlipped ? "Back Side" : "Front Side"}
                </Badge>
                <Text size="xs" c="dimmed">
                  Click card to flip
                </Text>
              </Group>

              <Stack align="center" justify="center" my="auto" gap="md">
                {!isFlipped ? (
                  <>
                    {frontImageUrl && (
                      <Image
                        src={frontImageUrl}
                        alt="Front preview"
                        mah={160}
                        w="auto"
                        fit="contain"
                        radius="sm"
                      />
                    )}
                    <Text size="lg" fw={500} ta="center">
                      {cardData.frontText || "No front text provided"}
                    </Text>
                  </>
                ) : (
                  <>
                    {backImageUrl && (
                      <Image
                        src={backImageUrl}
                        alt="Back preview"
                        mah={160}
                        w="auto"
                        fit="contain"
                        radius="sm"
                      />
                    )}
                    <Text size="lg" fw={500} ta="center">
                      {cardData.backText || "No back text provided"}
                    </Text>
                  </>
                )}
              </Stack>

              <Text size="xs" c="dimmed" ta="center">
                {isFlipped ? "Showing Answer" : "Showing Question"}
              </Text>
            </Paper>

            <Group justify="space-between">
              <Button variant="default" onClick={handlePrevStep}>
                Back to Edit
              </Button>
              <Group>
                <Button
                  variant="light"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  Flip Card
                </Button>
                <Button color="green" onClick={handleSubmit}>
                  Confirm & Upload
                </Button>
              </Group>
            </Group>
          </Stack>
        </Stepper.Step>
      </Stepper>
    </Container>
  );
}

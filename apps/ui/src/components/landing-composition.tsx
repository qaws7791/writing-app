"use client";

import { useState } from "react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Avatar, AvatarFallback } from "@workspace/ui/components/primitives/avatar";
import { Bubble, BubbleContent, BubbleGroup } from "@workspace/ui/components/primitives/bubble";
import { Button } from "@workspace/ui/components/primitives/button";
import { Field, FieldDescription, FieldLabel } from "@workspace/ui/components/primitives/field";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@workspace/ui/components/primitives/message";
import { Prose, ProseBody, ProseSource } from "@workspace/ui/components/learning/prose";
import { Switch } from "@workspace/ui/components/primitives/switch";
import { Textarea } from "@workspace/ui/components/primitives/textarea";

const installCommand = 'import { Button } from "@workspace/ui/components/primitives/button"';

export default function LandingComposition() {
  const [copied, setCopied] = useState(false);
  const [quietChrome, setQuietChrome] = useState(true);

  async function copyInstallCommand() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="landing-composition grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
      <article className="min-w-0">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            원고
          </p>
          <Field orientation="horizontal" className="w-auto gap-3">
            <FieldLabel
              htmlFor="quiet-chrome"
              className="text-xs font-normal text-muted-foreground"
            >
              크롬 후퇴
            </FieldLabel>
            <Switch
              id="quiet-chrome"
              checked={quietChrome}
              onCheckedChange={setQuietChrome}
              aria-describedby="quiet-chrome-hint"
            />
          </Field>
        </div>

        <Prose>
          <ProseBody>
            <h3>콘텐츠가 전경을 차지한다</h3>
            <p>
              Luma는 화면을 장식하지 않습니다. 이미지, 글, 데이터와 사용자 작업물이 감정과 색을
              만들고, 인터페이스는 이를 정돈하는 프레임으로 남습니다.
            </p>
            <blockquote>
              구조는 박스의 수가 아니라 공간, 정렬, 밀도와 표면 차이로 느껴져야 한다.
            </blockquote>
            <p>
              Primary 행동은 하나면 충분합니다. 색과 그림자를 늘리기보다 배치와 rhythm으로 관계를
              설명합니다.
            </p>
          </ProseBody>
          <ProseSource>DESIGN.md · Identity & Core Principles</ProseSource>
        </Prose>

        <div
          id="quiet-chrome-hint"
          className={
            quietChrome
              ? "mt-10 border-t border-transparent pt-8"
              : "mt-10 border-t border-border/70 pt-8"
          }
        >
          <Field>
            <FieldLabel htmlFor="landing-note">다음 문장</FieldLabel>
            <Textarea
              id="landing-note"
              rows={3}
              defaultValue="미니멀하되 비어 있지 않다. 감각적이되 장식적이지 않다."
            />
            <FieldDescription>작성 중인 문장은 캔버스에 직접 놓입니다.</FieldDescription>
          </Field>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm">저장</Button>
            <Button size="sm" variant="ghost">
              초안 유지
            </Button>
          </div>
        </div>
      </article>

      <aside className="flex min-w-0 flex-col justify-between gap-10">
        <MessageGroup className="gap-5">
          <Message>
            <MessageAvatar>
              <Avatar size="sm">
                <AvatarFallback>설</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>설계</MessageHeader>
              <BubbleGroup>
                <Bubble variant="muted">
                  <BubbleContent>
                    카드로 감싸기 전에, 여백만으로 계층이 읽히는지 먼저 확인해 주세요.
                  </BubbleContent>
                </Bubble>
              </BubbleGroup>
            </MessageContent>
          </Message>

          <Message align="end">
            <MessageAvatar>
              <Avatar size="sm">
                <AvatarFallback>나</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>작성</MessageHeader>
              <BubbleGroup>
                <Bubble>
                  <BubbleContent>
                    border를 하나 줄여도 구조가 유지됩니다. 설치는 문서에서 이어갈게요.
                  </BubbleContent>
                </Bubble>
              </BubbleGroup>
            </MessageContent>
          </Message>
        </MessageGroup>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            가져오기
          </p>
          <div className="flex items-center gap-2 rounded-2xl bg-muted/70 p-2 pl-4">
            <code className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm">
              {installCommand}
            </code>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label={copied ? "복사됨" : "가져오기 경로 복사"}
              onClick={copyInstallCommand}
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={1.8} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {copied
              ? "클립보드에 복사했습니다."
              : "모노레포 내부 workspace 패키지 @workspace/ui에서 가져옵니다."}
          </p>
        </div>
      </aside>
    </div>
  );
}

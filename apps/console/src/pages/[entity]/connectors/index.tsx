import * as React from "react";
import { PageBase, ResourceListPageMainView } from "@instill-ai/toolkit";
import { Logo } from "@instill-ai/design-system";

import { ConsoleCorePageHead, Topbar } from "../../../components";
import { NextPageWithLayout } from "../../_app";
import { useAccessToken } from "../../../lib/useAccessToken";
import { useRouter } from "next/router";
import { useTrackToken } from "../../../lib/useTrackToken";

const PipelinePage: NextPageWithLayout = () => {
  const router = useRouter();
  const accessToken = useAccessToken();
  useTrackToken({ enabled: true });
  return (
    <React.Fragment>
      <ConsoleCorePageHead title="pipelines" />
      <ResourceListPageMainView
        accessToken={accessToken.isSuccess ? accessToken.data : null}
        enableQuery={accessToken.isSuccess}
        router={router}
      />
    </React.Fragment>
  );
};

PipelinePage.getLayout = (page) => {
  return (
    <PageBase>
      <Topbar logo={<Logo variant="colourLogomark" width={38} />} />
      <PageBase.Container>
        <PageBase.Content contentPadding="p-8">{page}</PageBase.Content>
      </PageBase.Container>
    </PageBase>
  );
};

export default PipelinePage;
